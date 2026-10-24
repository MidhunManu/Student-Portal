import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as EventService from "../src/service/event.service.js";
import * as UserModel from "../src/model/user.model.js";
import { RegistrationStatus } from "../src/enums/registration.status.js";

describe("Event Management, Capacity, Waitlist & Auto-Promotion Suite", () => {
    it("should handle event capacity, waitlisting, and automatic waitlist promotion on cancellation", async () => {
        // Find existing users for testing
        const admin = await UserModel.findByEmail("admin@college.edu");
        const student = await UserModel.findByEmail("student@college.edu");
        const alumni = await UserModel.findByEmail("alumni@college.edu");

        assert.ok(admin, "Admin user must exist");
        assert.ok(student, "Student user must exist");
        assert.ok(alumni, "Alumni user must exist");

        // 1. Create a test event with capacity of 1
        const eventId = await EventService.createEvent({
            title: "Waitlist Test Symposium",
            description: "Testing strict capacity and waitlist promotion logic",
            location: "Room 101",
            eventDate: new Date(Date.now() + 86400000 * 7),
            registrationDeadline: new Date(Date.now() + 86400000 * 5),
            capacity: 1, // Capacity is 1 seat!
            createdBy: admin.id,
        });

        assert.ok(eventId > 0);

        // 2. Student registers -> Should be CONFIRMED (1st seat)
        const reg1 = await EventService.registerForEvent(eventId, student.id);
        assert.equal(reg1.status, RegistrationStatus.CONFIRMED);

        // 3. Student attempts duplicate registration -> Should be rejected
        await assert.rejects(
            async () => {
                await EventService.registerForEvent(eventId, student.id);
            },
            {
                name: "Error",
                message: "ALREADY_REGISTERED",
            }
        );

        // 4. Alumni registers -> Event is full (1/1) -> Should be WAITLISTED
        const reg2 = await EventService.registerForEvent(eventId, alumni.id);
        assert.equal(reg2.status, RegistrationStatus.WAITLISTED);

        // Verify status in DB
        const reg2Record = await EventService.getUserRegistrationForEvent(eventId, alumni.id);
        assert.equal(reg2Record?.status, RegistrationStatus.WAITLISTED);

        // 5. Student cancels confirmed registration
        const cancelResult = await EventService.cancelRegistration(eventId, student.id);
        assert.equal(cancelResult.cancelled, true);

        // 6. Verify alumni was AUTOMATICALLY PROMOTED to CONFIRMED!
        const promotedRecord = await EventService.getUserRegistrationForEvent(eventId, alumni.id);
        assert.equal(promotedRecord?.status, RegistrationStatus.CONFIRMED);
    });

    it("should enforce registration deadlines", async () => {
        const admin = await UserModel.findByEmail("admin@college.edu");
        const student = await UserModel.findByEmail("student@college.edu");

        // Create an event whose deadline has already passed
        const pastDeadlineEventId = await EventService.createEvent({
            title: "Expired Deadline Event",
            description: "Testing deadline enforcement",
            location: "Room 202",
            eventDate: new Date(Date.now() + 86400000),
            registrationDeadline: new Date(Date.now() - 3600000), // 1 hour ago
            capacity: 10,
            createdBy: admin!.id,
        });

        await assert.rejects(
            async () => {
                await EventService.registerForEvent(pastDeadlineEventId, student!.id);
            },
            {
                name: "Error",
                message: "REGISTRATION_DEADLINE_PASSED",
            }
        );
    });
});
