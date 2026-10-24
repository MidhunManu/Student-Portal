import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
    if (!req.session) {
        return next();
    }

    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }

    res.locals.csrfToken = req.session.csrfToken;

    // Skip CSRF check for API routes and safe HTTP methods
    const isApi = req.path.startsWith("/api") || req.originalUrl.startsWith("/api");
    const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(req.method);

    if (isApi || isSafeMethod) {
        return next();
    }

    // Verify token on state-changing requests
    const submittedToken =
        (req.body && typeof req.body === "object" ? req.body._csrf : undefined) ||
        req.headers["x-csrf-token"] ||
        req.headers["xsrf-token"];

    if (!submittedToken || submittedToken !== req.session.csrfToken) {
        res.status(403);
        if (req.accepts("html")) {
            return res.render("errors/403", {
                title: "403 Forbidden",
                message: "Invalid or missing CSRF token. Please refresh the page and try again.",
            });
        }
        res.json({ error: "Invalid CSRF token" });
        return;
    }

    next();
}
