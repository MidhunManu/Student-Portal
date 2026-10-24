import type { Request, Response, NextFunction } from "express";
import * as AnnouncementService from "../../service/announcement.service.js";

export async function listAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await AnnouncementService.listAnnouncements({
            search: req.query.search as string | undefined,
            category: req.query.category as any,
            status: req.query.status as any,
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const announcement = await AnnouncementService.getAnnouncementById(id);
        if (!announcement) {
            res.status(404).json({ error: "Announcement not found" });
            return;
        }
        res.status(200).json({ announcement });
    } catch (error) {
        next(error);
    }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const announcementId = await AnnouncementService.createAnnouncement({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            status: req.body.status,
            createdBy: req.apiUser!.id,
        });
        res.status(201).json({ message: "Announcement created successfully", announcementId });
    } catch (error) {
        if (error instanceof Error && ["TITLE_REQUIRED", "CONTENT_REQUIRED", "INVALID_CATEGORY", "INVALID_STATUS"].includes(error.message)) {
            res.status(400).json({ error: error.message });
            return;
        }
        next(error);
    }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        await AnnouncementService.updateAnnouncement(id, {
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            status: req.body.status,
        });
        res.status(200).json({ message: "Announcement updated successfully" });
    } catch (error) {
        if (error instanceof Error && error.message === "ANNOUNCEMENT_NOT_FOUND") {
            res.status(404).json({ error: "Announcement not found" });
            return;
        }
        next(error);
    }
}

export async function deleteAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        await AnnouncementService.deleteAnnouncement(id);
        res.status(200).json({ message: "Announcement deleted successfully" });
    } catch (error) {
        if (error instanceof Error && error.message === "ANNOUNCEMENT_NOT_FOUND") {
            res.status(404).json({ error: "Announcement not found" });
            return;
        }
        next(error);
    }
}
