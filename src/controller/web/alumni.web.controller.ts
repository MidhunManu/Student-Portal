import type { Request, Response, NextFunction } from "express";
import * as DashboardService from "../../service/dashboard.service.js";
import * as AlumniService from "../../service/alumni.service.js";

export async function renderAlumniDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const alumni = req.session.user!;
        const data = await DashboardService.getAlumniDashboardData(alumni.id);

        res.render("alumni/dashboard", {
            title: "Alumni Dashboard - Apex Portal",
            alumni,
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function renderAlumniProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.session.user!.id;
        const profile = await AlumniService.getProfileByUserId(userId);

        res.render("alumni/profile", {
            title: "My Alumni Profile - Apex Portal",
            profile: profile || {
                graduationYear: new Date().getFullYear(),
                degree: "",
                major: "",
                company: "",
                role: "",
                location: "",
                bio: "",
                linkedinUrl: "",
                githubUrl: "",
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function handleUpdateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.session.user!.id;
        const role = req.session.user!.role;

        await AlumniService.updateProfile(userId, userId, role, {
            graduationYear: Number(req.body.graduationYear),
            degree: req.body.degree,
            major: req.body.major,
            company: req.body.company,
            role: req.body.role,
            location: req.body.location,
            bio: req.body.bio,
            linkedinUrl: req.body.linkedinUrl,
            githubUrl: req.body.githubUrl,
        });

        req.session.flash = { success: "Your alumni profile has been updated successfully." };
        res.redirect("/alumni/profile");
    } catch (error) {
        if (error instanceof Error && ["INVALID_GRADUATION_YEAR", "DEGREE_REQUIRED", "MAJOR_REQUIRED"].includes(error.message)) {
            req.session.flash = { error: `Profile update failed: ${error.message}` };
            return res.redirect("/alumni/profile");
        }
        next(error);
    }
}

export async function renderConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.session.user!.id;
        const data = await AlumniService.getUserConnections(userId);

        res.render("alumni/connections", {
            title: "Alumni Connections - Apex Portal",
            connections: data.connections,
            pendingReceived: data.pendingReceived,
            pendingSent: data.pendingSent,
        });
    } catch (error) {
        next(error);
    }
}

export async function handleSendConnectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const requesterId = req.session.user!.id;
        const recipientId = Number(req.body.recipientId);

        await AlumniService.sendConnectionRequest(requesterId, recipientId);
        req.session.flash = { success: "Connection request sent successfully." };
        res.redirect(req.header("Referer") || "/alumni");
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "ALREADY_CONNECTED") {
                req.session.flash = { error: "You are already connected with this alumnus." };
                return res.redirect(req.header("Referer") || "/alumni");
            }
            if (error.message === "REQUEST_ALREADY_PENDING") {
                req.session.flash = { error: "A connection request is already pending." };
                return res.redirect(req.header("Referer") || "/alumni");
            }
            if (error.message === "CANNOT_CONNECT_TO_SELF") {
                req.session.flash = { error: "You cannot send a connection request to yourself." };
                return res.redirect(req.header("Referer") || "/alumni");
            }
        }
        next(error);
    }
}

export async function handleRespondConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.session.user!.id;
        const connectionId = Number(req.body.connectionId);
        const action = req.body.action as "ACCEPT" | "REJECT";

        await AlumniService.respondToConnectionRequest(userId, connectionId, action);
        req.session.flash = {
            success: action === "ACCEPT" ? "Connection request accepted!" : "Connection request declined.",
        };
        res.redirect("/alumni/connections");
    } catch (error) {
        next(error);
    }
}

export async function handleRemoveConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.session.user!.id;
        const role = req.session.user!.role;
        const connectionId = Number(req.body.connectionId);

        await AlumniService.removeConnection(userId, connectionId, role);
        req.session.flash = { success: "Connection removed successfully." };
        res.redirect("/alumni/connections");
    } catch (error) {
        next(error);
    }
}
