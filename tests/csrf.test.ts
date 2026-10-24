import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("CSRF Protection Suite", () => {
    it("should reject state-changing form submission without CSRF token", async () => {
        const res = await request(app)
            .post("/login")
            .set("Accept", "text/html")
            .send({
                email: "admin@college.edu",
                password: "Admin@123",
            });

        // CSRF middleware responds with 403 Forbidden
        assert.equal(res.status, 403);
    });

    it("should allow state-changing form submission with valid CSRF token from session", async () => {
        const agent = request.agent(app);

        // 1. GET /login to initialize session and retrieve CSRF token
        const getRes = await agent.get("/login");
        assert.equal(getRes.status, 200);

        // Extract csrf token from HTML
        const match = getRes.text.match(/name="_csrf" value="([a-f0-9]+)"/);
        assert.ok(match && match[1], "CSRF token must be present in login form");
        const csrfToken = match[1];

        // 2. Submit form with extracted CSRF token
        const postRes = await agent
            .post("/login")
            .type("form")
            .send({
                _csrf: csrfToken,
                email: "admin@college.edu",
                password: "Admin@123",
            });

        // Successful login redirects to /admin/dashboard (status 302)
        assert.equal(postRes.status, 302);
        assert.equal(postRes.header.location, "/admin/dashboard");
    });

    it("API routes should be exempt from browser session CSRF check", async () => {
        const res = await request(app)
            .post("/api/users/login")
            .send({
                email: "admin@college.edu",
                password: "Admin@123",
            });

        // Does not return 403 CSRF error, proceeds to auth handler
        assert.equal(res.status, 200);
    });
});
