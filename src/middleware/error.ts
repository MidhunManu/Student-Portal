import type { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404);
    if (req.accepts("html") && !req.path.startsWith("/api")) {
        return res.render("errors/404", {
            title: "404 Not Found",
            message: "The requested page could not be found.",
        });
    }
    res.json({ error: "Resource not found" });
}

export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    logger.error({ err, path: req.path, method: req.method }, "Unhandled application error");

    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode);

    if (req.accepts("html") && !req.path.startsWith("/api")) {
        return res.render("errors/500", {
            title: "500 Server Error",
            message:
                process.env.NODE_ENV === "production"
                    ? "An unexpected error occurred. Please try again later."
                    : err instanceof Error
                    ? err.message
                    : "Unknown error",
        });
    }

    res.json({
        error:
            process.env.NODE_ENV === "production"
                ? "An unexpected error occurred"
                : err instanceof Error
                ? err.message
                : "Internal server error",
    });
}
