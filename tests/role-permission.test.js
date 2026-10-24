import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
describe("Role-Based Authorization & Protected UI Routes", () => {
    it("should redirect unauthenticated guest to /login when accessing /student/dashboard", async () => {
        const res = await request(app).get("/student/dashboard");
        assert.equal(res.status, 302);
        assert.equal(res.header.location, "/login");
    });
    it("should redirect unauthenticated guest when accessing /admin/dashboard", async () => {
        const res = await request(app).get("/admin/dashboard");
        assert.equal(res.status, 302);
        assert.equal(res.header.location, "/login");
    });
    it("should prevent a logged-in STUDENT from accessing /admin/dashboard (403 Forbidden)", async () => {
        const agent = request.agent(app);
        // 1. Get CSRF token
        const loginPage = await agent.get("/login");
        const match = loginPage.text.match(/name="_csrf" value="([a-f0-9]+)"/);
        const csrfToken = match[1];
        // 2. Log in as student
        await agent
            .post("/login")
            .type("form")
            .send({
            _csrf: csrfToken,
            email: "student@college.edu",
            password: "Student@123",
        });
        // 3. Try to access /admin/dashboard
        const forbiddenRes = await agent.get("/admin/dashboard");
        assert.equal(forbiddenRes.status, 403);
    });
    it("should prevent a logged-in ALUMNI from accessing /student/dashboard (403 Forbidden)", async () => {
        const agent = request.agent(app);
        // 1. Get CSRF token
        const loginPage = await agent.get("/login");
        const match = loginPage.text.match(/name="_csrf" value="([a-f0-9]+)"/);
        const csrfToken = match[1];
        // 2. Log in as alumni
        await agent
            .post("/login")
            .type("form")
            .send({
            _csrf: csrfToken,
            email: "alumni@college.edu",
            password: "Alumni@123",
        });
        // 3. Try to access /student/dashboard
        const forbiddenRes = await agent.get("/student/dashboard");
        assert.equal(forbiddenRes.status, 403);
    });
});
//# sourceMappingURL=role-permission.test.js.map