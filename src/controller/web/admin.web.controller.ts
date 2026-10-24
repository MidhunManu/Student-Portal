import type { Request, Response, NextFunction } from "express";
import * as DashboardService from "../../service/dashboard.service.js";
import * as EventService from "../../service/event.service.js";
import * as AnnouncementService from "../../service/announcement.service.js";
import * as JobService from "../../service/job.service.js";
import * as UserService from "../../service/user.service.js";
import { UserRole } from "../../enums/user.role.js";
import { AnnouncementCategory, AnnouncementStatus } from "../../enums/announcement.status.js";
import { EventStatus } from "../../enums/event.status.js";

export async function renderAdminDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = await DashboardService.getAdminDashboardData();
        res.render("admin/dashboard", {
            title: "Administrator Dashboard - Apex Portal",
            data,
        });
    } catch (error) {
        next(error);
    }
}

// Manage Events
export async function renderAdminEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const result = await EventService.listEvents({
            search: req.query.search as string,
            status: req.query.status as any,
            page,
            limit: 15,
        });

        res.render("admin/events", {
            title: "Manage Events - Admin Portal",
            events: result.events,
            total: result.total,
            currentPage: page,
            totalPages: Math.ceil(result.total / 15),
            query: req.query,
        });
    } catch (error) {
        next(error);
    }
}

export async function renderNewEventForm(req: Request, res: Response): Promise<void> {
    res.render("admin/event-form", {
        title: "Create Campus Event - Admin Portal",
        event: null,
        isEdit: false,
    });
}

export async function handleCreateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await EventService.createEvent({
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            eventDate: new Date(req.body.eventDate),
            registrationDeadline: new Date(req.body.registrationDeadline),
            capacity: Number(req.body.capacity),
            createdBy: req.session.user!.id,
        });

        req.session.flash = { success: "Event created successfully." };
        res.redirect("/admin/events");
    } catch (error) {
        if (error instanceof Error) {
            req.session.flash = { error: `Failed to create event: ${error.message}` };
            return res.redirect("/admin/events/new");
        }
        next(error);
    }
}

export async function renderEditEventForm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const event = await EventService.getEventById(id);
        if (!event) {
            req.session.flash = { error: "Event not found" };
            return res.redirect("/admin/events");
        }

        res.render("admin/event-form", {
            title: `Edit Event: ${event.title}`,
            event,
            isEdit: true,
        });
    } catch (error) {
        next(error);
    }
}

export async function handleEditEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        await EventService.updateEvent(id, {
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
            registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : undefined,
            capacity: req.body.capacity ? Number(req.body.capacity) : undefined,
            status: req.body.status as EventStatus,
        });

        req.session.flash = { success: "Event updated successfully." };
        res.redirect("/admin/events");
    } catch (error) {
        if (error instanceof Error) {
            req.session.flash = { error: `Failed to update event: ${error.message}` };
            return res.redirect(`/admin/events/${req.params.id}/edit`);
        }
        next(error);
    }
}

export async function handleCancelEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        await EventService.cancelEvent(id);
        req.session.flash = { success: "Event has been marked as cancelled." };
        res.redirect("/admin/events");
    } catch (error) {
        next(error);
    }
}

// Manage Announcements
export async function renderAdminAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const result = await AnnouncementService.listAnnouncements({
            search: req.query.search as string,
            category: req.query.category as any,
            status: req.query.status as any,
            page,
            limit: 15,
        });

        res.render("admin/announcements", {
            title: "Manage Announcements - Admin Portal",
            announcements: result.announcements,
            total: result.total,
            currentPage: page,
            totalPages: Math.ceil(result.total / 15),
            query: req.query,
            categories: Object.values(AnnouncementCategory),
            statuses: Object.values(AnnouncementStatus),
        });
    } catch (error) {
        next(error);
    }
}

export async function renderNewAnnouncementForm(req: Request, res: Response): Promise<void> {
    res.render("admin/announcement-form", {
        title: "Create College Announcement - Admin Portal",
        announcement: null,
        isEdit: false,
        categories: Object.values(AnnouncementCategory),
        statuses: Object.values(AnnouncementStatus),
    });
}

export async function handleCreateAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await AnnouncementService.createAnnouncement({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category as AnnouncementCategory,
            status: req.body.status as AnnouncementStatus,
            createdBy: req.session.user!.id,
        });

        req.session.flash = { success: "Announcement created successfully." };
        res.redirect("/admin/announcements");
    } catch (error) {
        if (error instanceof Error) {
            req.session.flash = { error: `Failed to create announcement: ${error.message}` };
            return res.redirect("/admin/announcements/new");
        }
        next(error);
    }
}

export async function renderEditAnnouncementForm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const announcement = await AnnouncementService.getAnnouncementById(id);
        if (!announcement) {
            req.session.flash = { error: "Announcement not found" };
            return res.redirect("/admin/announcements");
        }

        res.render("admin/announcement-form", {
            title: `Edit Announcement: ${announcement.title}`,
            announcement,
            isEdit: true,
            categories: Object.values(AnnouncementCategory),
            statuses: Object.values(AnnouncementStatus),
        });
    } catch (error) {
        next(error);
    }
}

export async function handleEditAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        await AnnouncementService.updateAnnouncement(id, {
            title: req.body.title,
            content: req.body.content,
            category: req.body.category as AnnouncementCategory,
            status: req.body.status as AnnouncementStatus,
        });

        req.session.flash = { success: "Announcement updated successfully." };
        res.redirect("/admin/announcements");
    } catch (error) {
        if (error instanceof Error) {
            req.session.flash = { error: `Failed to update announcement: ${error.message}` };
            return res.redirect(`/admin/announcements/${req.params.id}/edit`);
        }
        next(error);
    }
}

export async function handleDeleteAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        await AnnouncementService.deleteAnnouncement(id);
        req.session.flash = { success: "Announcement deleted successfully." };
        res.redirect("/admin/announcements");
    } catch (error) {
        next(error);
    }
}

// Moderate Jobs
export async function renderAdminJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const result = await JobService.listJobs({
            search: req.query.search as string,
            status: req.query.status as any,
            page,
            limit: 15,
        });

        res.render("admin/jobs", {
            title: "Moderate Job Posts - Admin Portal",
            jobs: result.jobs,
            total: result.total,
            currentPage: page,
            totalPages: Math.ceil(result.total / 15),
            query: req.query,
        });
    } catch (error) {
        next(error);
    }
}

export async function handleDeleteJobAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const adminId = req.session.user!.id;
        await JobService.deleteJob(id, adminId, UserRole.ADMIN);
        req.session.flash = { success: "Job post deleted successfully." };
        res.redirect("/admin/jobs");
    } catch (error) {
        next(error);
    }
}

// Manage Users
export async function renderAdminUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const result = await UserService.listUsers({
            search: req.query.search as string,
            role: req.query.role as string,
            page,
            limit: 20,
        });

        res.render("admin/users", {
            title: "Manage Users & Roles - Admin Portal",
            users: result.users,
            total: result.total,
            currentPage: page,
            totalPages: Math.ceil(result.total / 20),
            query: req.query,
            roles: Object.values(UserRole),
        });
    } catch (error) {
        next(error);
    }
}

export async function handleUpdateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const adminId = req.session.user!.id;
        const targetUserId = Number(req.params.id);
        const newRole = req.body.role as UserRole;

        await UserService.updateUserRole(adminId, targetUserId, newRole);
        req.session.flash = { success: "User role updated successfully." };
        res.redirect("/admin/users");
    } catch (error) {
        if (error instanceof Error && error.message === "CANNOT_MODIFY_OWN_ROLE") {
            req.session.flash = { error: "You cannot change your own administrator role." };
            return res.redirect("/admin/users");
        }
        next(error);
    }
}
