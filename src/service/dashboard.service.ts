import * as UserModel from "../model/user.model.js";
import * as EventModel from "../model/event.model.js";
import * as RegistrationModel from "../model/registration.model.js";
import * as AlumniModel from "../model/alumni.model.js";
import * as ConnectionModel from "../model/connection.model.js";
import * as JobModel from "../model/job.model.js";
import * as AnnouncementModel from "../model/announcement.model.js";
import { AnnouncementStatus } from "../enums/announcement.status.js";
import { EventStatus } from "../enums/event.status.js";

export async function getStudentDashboardData(userId: number) {
    const [registrations, upcomingEvents, announcements] = await Promise.all([
        RegistrationModel.listByUser(userId),
        EventModel.list({ upcomingOnly: true, status: EventStatus.UPCOMING, limit: 4 }),
        AnnouncementModel.list({ status: AnnouncementStatus.PUBLISHED, limit: 3 }),
    ]);

    const confirmedCount = registrations.filter((r) => r.status === "CONFIRMED").length;
    const waitlistedCount = registrations.filter((r) => r.status === "WAITLISTED").length;

    return {
        registrations,
        confirmedCount,
        waitlistedCount,
        upcomingEvents: upcomingEvents.events,
        announcements: announcements.announcements,
    };
}

export async function getAlumniDashboardData(userId: number) {
    const [profile, connectionsData, myJobs, announcements] = await Promise.all([
        AlumniModel.findByUserId(userId),
        ConnectionModel.listUserConnections(userId),
        JobModel.list({ postedBy: userId, limit: 5 }),
        AnnouncementModel.list({ status: AnnouncementStatus.PUBLISHED, limit: 3 }),
    ]);

    return {
        profile,
        connectionsCount: connectionsData.connections.length,
        pendingRequestsCount: connectionsData.pendingReceived.length,
        myJobs: myJobs.jobs,
        announcements: announcements.announcements,
    };
}

export async function getAdminDashboardData() {
    const [roleCounts, totalEvents, upcomingEvents, totalRegistrations, activeJobs, publishedAnnouncements, recentEvents, recentAnnouncements] =
        await Promise.all([
            UserModel.getCountsByRole(),
            EventModel.countTotal(),
            EventModel.countUpcoming(),
            RegistrationModel.countTotal(),
            JobModel.countActive(),
            AnnouncementModel.countPublished(),
            EventModel.list({ limit: 5 }),
            AnnouncementModel.list({ limit: 5 }),
        ]);

    return {
        counts: {
            students: roleCounts["STUDENT"] ?? 0,
            alumni: roleCounts["ALUMNI"] ?? 0,
            admins: roleCounts["ADMIN"] ?? 0,
            totalUsers: (roleCounts["STUDENT"] ?? 0) + (roleCounts["ALUMNI"] ?? 0) + (roleCounts["ADMIN"] ?? 0),
            totalEvents,
            upcomingEvents,
            totalRegistrations,
            activeJobs,
            publishedAnnouncements,
        },
        recentEvents: recentEvents.events,
        recentAnnouncements: recentAnnouncements.announcements,
    };
}
