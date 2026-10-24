import type { Request, Response, NextFunction } from "express";
import * as UserService from "../../service/user.service.js";
import * as CollegeModel from "../../model/college.model.js";
import * as EventModel from "../../model/event.model.js";
import * as AnnouncementModel from "../../model/announcement.model.js";
import { UserRole } from "../../enums/user.role.js";
import { EventStatus } from "../../enums/event.status.js";
import { AnnouncementStatus } from "../../enums/announcement.status.js";

export async function renderLanding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const [eventsData, announcementsData] = await Promise.all([
            EventModel.list({ upcomingOnly: true, status: EventStatus.UPCOMING, limit: 3 }),
            AnnouncementModel.list({ status: AnnouncementStatus.PUBLISHED, limit: 3 }),
        ]);

        res.render("public/landing", {
            title: "Apex Portal - Empowering Campus & Alumni Excellence",
            events: eventsData.events,
            announcements: announcementsData.announcements,
        });
    } catch (error) {
        next(error);
    }
}

export async function renderLogin(req: Request, res: Response): Promise<void> {
    res.render("public/login", {
        title: "Sign In - Apex Student Portal",
        email: req.query.email || "",
    });
}

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;
        const result = await UserService.login({ email, password });

        req.session.user = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            collegeId: result.user.collegeId,
        };

        const returnTo = req.session.returnTo;
        delete req.session.returnTo;

        req.session.flash = { success: `Welcome back, ${result.user.name}!` };

        if (returnTo && !returnTo.startsWith("/login") && !returnTo.startsWith("/register")) {
            return res.redirect(returnTo);
        }

        // Direct to role-specific dashboard
        switch (result.user.role) {
            case UserRole.ADMIN:
                return res.redirect("/admin/dashboard");
            case UserRole.ALUMNI:
                return res.redirect("/alumni/dashboard");
            case UserRole.STUDENT:
            default:
                return res.redirect("/student/dashboard");
        }
    } catch (error) {
        if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
            req.session.flash = { error: "Invalid email or password. Please verify your credentials." };
            return res.redirect("/login");
        }
        next(error);
    }
}

export async function renderRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const colleges = await CollegeModel.getAllColleges();
        res.render("public/register", {
            title: "Register Account - Apex Student Portal",
            colleges,
            values: {},
        });
    } catch (error) {
        next(error);
    }
}

export async function handleRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name, email, password, confirmPassword, collegeId, role } = req.body;

        if (password !== confirmPassword) {
            req.session.flash = { error: "Passwords do not match." };
            return res.redirect("/register");
        }

        const chosenRole = role === "ALUMNI" ? UserRole.ALUMNI : UserRole.STUDENT;

        const user = await UserService.register(
            {
                name,
                email,
                password,
                collegeId: collegeId ? Number(collegeId) : null,
                role: chosenRole,
            },
            true // Public registration: strictly blocks ADMIN role creation!
        );

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            collegeId: user.collegeId,
        };

        req.session.flash = { success: "Account created successfully! Welcome to the portal." };

        if (chosenRole === UserRole.ALUMNI) {
            return res.redirect("/alumni/profile");
        }
        return res.redirect("/student/dashboard");
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "EMAIL_ALREADY_EXISTS") {
                req.session.flash = { error: "This email address is already registered. Please sign in." };
                return res.redirect("/register");
            }
            if (error.message === "PASSWORD_TOO_SHORT") {
                req.session.flash = { error: "Password must be at least 8 characters long." };
                return res.redirect("/register");
            }
            if (error.message === "INVALID_NAME" || error.message === "INVALID_EMAIL") {
                req.session.flash = { error: "Please provide a valid name and email address." };
                return res.redirect("/register");
            }
            if (error.message === "ADMIN_REGISTRATION_FORBIDDEN") {
                req.session.flash = { error: "Administrator registration is restricted." };
                return res.redirect("/register");
            }
        }
        next(error);
    }
}

export async function handleLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (req.session?.user) {
            await UserService.logout(req.session.user.id);
        }
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.clearCookie("connect.sid");
            res.redirect("/login");
        });
    } catch (error) {
        next(error);
    }
}

export function handleDashboardRedirect(req: Request, res: Response): void {
    if (!req.session?.user) {
        return res.redirect("/login");
    }
    switch (req.session.user.role) {
        case UserRole.ADMIN:
            return res.redirect("/admin/dashboard");
        case UserRole.ALUMNI:
            return res.redirect("/alumni/dashboard");
        case UserRole.STUDENT:
        default:
            return res.redirect("/student/dashboard");
    }
}
