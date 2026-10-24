import type { Request, Response, NextFunction } from "express";
import * as AlumniService from "../../service/alumni.service.js";

export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.apiUser!.id;
        const profile = await AlumniService.getProfileByUserId(userId);
        res.status(200).json({ profile });
    } catch (error) {
        next(error);
    }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.apiUser!.id;
        const role = req.apiUser!.role;
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
        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        if (error instanceof Error && ["INVALID_GRADUATION_YEAR", "DEGREE_REQUIRED", "MAJOR_REQUIRED"].includes(error.message)) {
            res.status(400).json({ error: error.message });
            return;
        }
        next(error);
    }
}

export async function listDirectory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const filter = {
            search: req.query.search as string | undefined,
            graduationYear: req.query.graduationYear ? Number(req.query.graduationYear) : undefined,
            degree: req.query.degree as string | undefined,
            company: req.query.company as string | undefined,
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 12,
        };
        const result = await AlumniService.listDirectory(filter);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function sendConnectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const requesterId = req.apiUser!.id;
        const recipientId = Number(req.body.recipientId);
        const connectionId = await AlumniService.sendConnectionRequest(requesterId, recipientId);
        res.status(201).json({ message: "Connection request sent", connectionId });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "CANNOT_CONNECT_TO_SELF" || error.message === "ALREADY_CONNECTED" || error.message === "REQUEST_ALREADY_PENDING") {
                res.status(400).json({ error: error.message });
                return;
            }
            if (error.message === "RECIPIENT_NOT_FOUND") {
                res.status(404).json({ error: "Recipient alumni not found" });
                return;
            }
        }
        next(error);
    }
}

export async function respondConnectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.apiUser!.id;
        const connectionId = Number(req.params.id);
        const action = req.body.action as "ACCEPT" | "REJECT";
        await AlumniService.respondToConnectionRequest(userId, connectionId, action);
        res.status(200).json({ message: `Connection request ${action.toLowerCase()}ed` });
    } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHORIZED_ACTION") {
            res.status(403).json({ error: "Unauthorized to respond to this connection request" });
            return;
        }
        next(error);
    }
}

export async function removeConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.apiUser!.id;
        const role = req.apiUser!.role;
        const connectionId = Number(req.params.id);
        await AlumniService.removeConnection(userId, connectionId, role);
        res.status(200).json({ message: "Connection removed successfully" });
    } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHORIZED_ACTION") {
            res.status(403).json({ error: "Unauthorized to remove this connection" });
            return;
        }
        next(error);
    }
}

export async function getMyConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.apiUser!.id;
        const result = await AlumniService.getUserConnections(userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}
