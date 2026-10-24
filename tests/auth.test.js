import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import * as UserService from "../src/service/user.service.js";
import { UserRole } from "../src/enums/user.role.js";
describe("Authentication & Authorization Suite", () => {
    it("should prevent public registration with ADMIN role", async () => {
        await assert.rejects(async () => {
            await UserService.register({
                name: "Hacker Admin",
                email: "hacker@test.com",
                password: "Password123!",
                role: UserRole.ADMIN,
            }, true // isPublicRegistration = true
            );
        }, {
            name: "Error",
            message: "ADMIN_REGISTRATION_FORBIDDEN",
        });
    });
    it("should reject registration with invalid email or short password", async () => {
        await assert.rejects(async () => {
            await UserService.register({
                name: "Test",
                email: "not-an-email",
                password: "short",
                role: UserRole.STUDENT,
            }, true);
        }, {
            name: "Error",
        });
    });
    it("should reject login with wrong credentials", async () => {
        await assert.rejects(async () => {
            await UserService.login({
                email: "nonexistent@college.edu",
                password: "WrongPassword123",
            });
        }, {
            name: "Error",
            message: "INVALID_CREDENTIALS",
        });
    });
    it("API: /api/users/register should reject admin role with 403", async () => {
        const res = await request(app)
            .post("/api/users/register")
            .send({
            name: "Intruder",
            email: "intruder@college.edu",
            password: "Password123!",
            role: "ADMIN",
        });
        assert.equal(res.status, 403);
        assert.ok(res.body.error);
    });
    it("API: /api/users/login should authenticate seeded admin and return JWT tokens", async () => {
        const res = await request(app)
            .post("/api/users/login")
            .send({
            email: "admin@college.edu",
            password: "Admin@123",
        });
        assert.equal(res.status, 200);
        assert.ok(res.body.accessToken);
        assert.ok(res.body.refreshToken);
        assert.equal(res.body.user.email, "admin@college.edu");
        assert.equal(res.body.user.role, "ADMIN");
    });
});
//# sourceMappingURL=auth.test.js.map