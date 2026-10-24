import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../enums/user.role.js";
import { verifyToken } from "../config/jwt.js";

export function populateLocals(req: Request, res: Response, next: NextFunction): void {
    res.locals.currentUser = req.session?.user ?? null;
    res.locals.currentPath = req.path;

    if (req.session?.flash) {
        res.locals.flash = { ...req.session.flash };
        delete req.session.flash;
    } else {
        res.locals.flash = {};
    }

    next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (!req.session?.user) {
        if (req.session) {
            req.session.returnTo = req.originalUrl;
            req.session.flash = { error: "Please sign in to access this page." };
        }
        return res.redirect("/login");
    }
    next();
}

export function requireGuest(req: Request, res: Response, next: NextFunction): void {
    if (req.session?.user) {
        return res.redirect("/dashboard");
    }
    next();
}

export function requireRole(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.session?.user) {
            if (req.session) {
                req.session.returnTo = req.originalUrl;
            }
            return res.redirect("/login");
        }

        if (!allowedRoles.includes(req.session.user.role)) {
            res.status(403);
            return res.render("errors/403", {
                title: "403 Forbidden",
                message: "You do not have permission to view or perform actions on this page.",
            });
        }

        next();
    };
}

export function requireApiAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization token" });
        return;
    }

    const token = authHeader.substring(7).trim();
    try {
        const decoded = verifyToken(token);
        req.apiUser = {
            id: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
            collegeId: decoded.collegeId,
        };
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

export function requireApiRole(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.apiUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!allowedRoles.includes(req.apiUser.role)) {
            res.status(403).json({ error: "Forbidden: insufficient permissions" });
            return;
        }

        next();
    };
}
