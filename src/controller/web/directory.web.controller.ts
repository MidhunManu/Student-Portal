import type { Request, Response, NextFunction } from "express";
import * as AlumniService from "../../service/alumni.service.js";
import * as ConnectionModel from "../../model/connection.model.js";
import { UserRole } from "../../enums/user.role.js";

export async function renderAlumniDirectory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const search = req.query.search as string | undefined;
        const degree = req.query.degree as string | undefined;
        const company = req.query.company as string | undefined;
        const graduationYear = req.query.graduationYear ? Number(req.query.graduationYear) : undefined;

        const result = await AlumniService.listDirectory({
            search,
            degree,
            company,
            graduationYear,
            page,
            limit: 12,
        });

        res.render("directory/index", {
            title: "Alumni Directory - Apex Portal",
            alumni: result.alumni,
            total: result.total,
            currentPage: page,
            totalPages: Math.ceil(result.total / 12),
            query: req.query,
        });
    } catch (error) {
        next(error);
    }
}

export async function renderAlumniProfileView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const targetUserId = Number(req.params.id);
        const profile = await AlumniService.getProfileByUserId(targetUserId);
        if (!profile) {
            res.status(404);
            return res.render("errors/404", {
                title: "Alumni Not Found",
                message: "The requested alumni profile could not be found.",
            });
        }

        let connectionStatus = null;
        let isSelf = false;

        if (req.session?.user) {
            isSelf = req.session.user.id === targetUserId;
            if (!isSelf && req.session.user.role === UserRole.ALUMNI) {
                const conn = await ConnectionModel.findConnectionBetween(req.session.user.id, targetUserId);
                if (conn) {
                    connectionStatus = {
                        status: conn.status,
                        isRequester: conn.requesterId === req.session.user.id,
                        connectionId: conn.id,
                    };
                }
            }
        }

        res.render("directory/profile", {
            title: `${profile.userName} - Alumni Profile`,
            profile,
            isSelf,
            connectionStatus,
        });
    } catch (error) {
        next(error);
    }
}
