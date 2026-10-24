import type { Request, Response, NextFunction } from "express";
import * as AnnouncementService from "../../service/announcement.service.js";
import { AnnouncementCategory, AnnouncementStatus } from "../../enums/announcement.status.js";

export async function renderAnnouncementList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const search = req.query.search as string | undefined;
        const category = req.query.category as any || "ALL";

        const result = await AnnouncementService.listAnnouncements({
            search,
            category,
            status: AnnouncementStatus.PUBLISHED,
            page,
            limit: 8,
        });

        res.render("announcements/index", {
            title: "Campus Announcements & News - Apex Portal",
            announcements: result.announcements,
            total: result.total,
            currentPage: page,
            totalPages: Math.ceil(result.total / 8),
            query: req.query,
            categories: Object.values(AnnouncementCategory),
        });
    } catch (error) {
        next(error);
    }
}

export async function renderAnnouncementDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const announcement = await AnnouncementService.getAnnouncementById(id);
        if (!announcement) {
            res.status(404);
            return res.render("errors/404", {
                title: "Announcement Not Found",
                message: "The requested announcement could not be found.",
            });
        }

        res.render("announcements/show", {
            title: `${announcement.title} - Apex Announcements`,
            announcement,
        });
    } catch (error) {
        next(error);
    }
}
