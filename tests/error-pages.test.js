import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
describe("Error Handling & 404 Suite", () => {
    it("should render 404 page for missing web routes", async () => {
        const res = await request(app)
            .get("/this-route-does-not-exist-at-all")
            .set("Accept", "text/html");
        assert.equal(res.status, 404);
        assert.ok(res.text.includes("404"));
        assert.ok(res.text.includes("Page Not Found"));
    });
    it("should return JSON 404 for missing API routes", async () => {
        const res = await request(app)
            .get("/api/unknown-endpoint")
            .set("Accept", "application/json");
        assert.equal(res.status, 404);
        assert.equal(res.body.error, "Resource not found");
    });
});
//# sourceMappingURL=error-pages.test.js.map