import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as AlumniService from "../src/service/alumni.service.js";
import * as UserModel from "../src/model/user.model.js";
import { UserRole } from "../src/enums/user.role.js";
import { ConnectionStatus } from "../src/enums/connection.status.js";

describe("Alumni Profile Ownership & Connections Suite", () => {
    it("should restrict profile updates to profile owner or administrator", async () => {
        const student = await UserModel.findByEmail("student@college.edu");
        const alumni = await UserModel.findByEmail("alumni@college.edu");

        assert.ok(student && alumni);

        // Student attempts to modify alumni's profile -> Should throw
        await assert.rejects(
            async () => {
                await AlumniService.updateProfile(
                    student.id, // requesting user
                    alumni.id,  // target user
                    UserRole.STUDENT,
                    {
                        graduationYear: 2020,
                        degree: "B.A.",
                        major: "History",
                    }
                );
            },
            {
                name: "Error",
                message: "UNAUTHORIZED_PROFILE_MODIFICATION",
            }
        );

        // Alumni updating their own profile -> Should succeed
        await AlumniService.updateProfile(
            alumni.id,
            alumni.id,
            UserRole.ALUMNI,
            {
                graduationYear: 2022,
                degree: "B.S. Computer Science",
                major: "Software Systems",
                company: "Google",
                role: "Staff Software Engineer",
            }
        );

        const updated = await AlumniService.getProfileByUserId(alumni.id);
        assert.equal(updated?.role, "Staff Software Engineer");
    });

    it("should prevent an alumnus from connecting to themselves", async () => {
        const alumni = await UserModel.findByEmail("alumni@college.edu");
        assert.ok(alumni);

        await assert.rejects(
            async () => {
                await AlumniService.sendConnectionRequest(alumni.id, alumni.id);
            },
            {
                name: "Error",
                message: "CANNOT_CONNECT_TO_SELF",
            }
        );
    });
});
