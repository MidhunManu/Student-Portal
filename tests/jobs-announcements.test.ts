import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as JobService from "../src/service/job.service.js";
import * as AnnouncementService from "../src/service/announcement.service.js";
import * as UserModel from "../src/model/user.model.js";
import { UserRole } from "../src/enums/user.role.js";
import { JobType } from "../src/enums/job.types.js";
import { AnnouncementCategory, AnnouncementStatus } from "../src/enums/announcement.status.js";

describe("Job Posts & Announcements Suite", () => {
    it("should enforce ownership for job post modification", async () => {
        const student = await UserModel.findByEmail("student@college.edu");
        const alumni = await UserModel.findByEmail("alumni@college.edu");

        assert.ok(student && alumni);

        // Alumni posts job
        const jobId = await JobService.createJob({
            postedBy: alumni.id,
            title: "Frontend Developer",
            company: "WebTech",
            location: "Remote",
            jobType: JobType.FULL_TIME,
            description: "Exciting frontend opportunity",
            applyUrlOrEmail: "jobs@webtech.com",
        });

        assert.ok(jobId > 0);

        // Student attempts to modify alumni's job -> Should throw
        await assert.rejects(
            async () => {
                await JobService.updateJob(jobId, student.id, UserRole.STUDENT, {
                    title: "Hacked Job Title",
                });
            },
            {
                name: "Error",
                message: "UNAUTHORIZED_JOB_MODIFICATION",
            }
        );

        // Student attempts to delete alumni's job -> Should throw
        await assert.rejects(
            async () => {
                await JobService.deleteJob(jobId, student.id, UserRole.STUDENT);
            },
            {
                name: "Error",
                message: "UNAUTHORIZED_JOB_DELETION",
            }
        );

        // Owner alumni can delete their own job
        await JobService.deleteJob(jobId, alumni.id, UserRole.ALUMNI);
        const deleted = await JobService.getJobById(jobId);
        assert.equal(deleted, null);
    });

    it("should allow creating and publishing announcements", async () => {
        const admin = await UserModel.findByEmail("admin@college.edu");
        assert.ok(admin);

        const announcementId = await AnnouncementService.createAnnouncement({
            title: "Library Renovation Announcement",
            content: "The central campus library will undergo routine maintenance this weekend.",
            category: AnnouncementCategory.CAMPUS,
            status: AnnouncementStatus.PUBLISHED,
            createdBy: admin.id,
        });

        assert.ok(announcementId > 0);

        const found = await AnnouncementService.getAnnouncementById(announcementId);
        assert.equal(found?.title, "Library Renovation Announcement");
        assert.equal(found?.status, AnnouncementStatus.PUBLISHED);

        // Cleanup
        await AnnouncementService.deleteAnnouncement(announcementId);
    });
});
