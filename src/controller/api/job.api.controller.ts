import type { Request, Response, NextFunction } from "express";
import * as JobService from "../../service/job.service.js";

export async function listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await JobService.listJobs({
            search: req.query.search as string | undefined,
            jobType: req.query.jobType as any,
            company: req.query.company as string | undefined,
            status: req.query.status as any,
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const job = await JobService.getJobById(id);
        if (!job) {
            res.status(404).json({ error: "Job post not found" });
            return;
        }
        res.status(200).json({ job });
    } catch (error) {
        next(error);
    }
}

export async function createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const jobId = await JobService.createJob({
            postedBy: req.apiUser!.id,
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            jobType: req.body.jobType,
            description: req.body.description,
            requirements: req.body.requirements,
            applyUrlOrEmail: req.body.applyUrlOrEmail,
        });
        res.status(201).json({ message: "Job post created successfully", jobId });
    } catch (error) {
        if (error instanceof Error && ["TITLE_REQUIRED", "COMPANY_REQUIRED", "LOCATION_REQUIRED", "DESCRIPTION_REQUIRED", "APPLY_INFO_REQUIRED", "INVALID_JOB_TYPE"].includes(error.message)) {
            res.status(400).json({ error: error.message });
            return;
        }
        next(error);
    }
}

export async function updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const userId = req.apiUser!.id;
        const role = req.apiUser!.role;

        await JobService.updateJob(id, userId, role, {
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            jobType: req.body.jobType,
            description: req.body.description,
            requirements: req.body.requirements,
            applyUrlOrEmail: req.body.applyUrlOrEmail,
            status: req.body.status,
        });
        res.status(200).json({ message: "Job post updated successfully" });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "JOB_NOT_FOUND") {
                res.status(404).json({ error: "Job post not found" });
                return;
            }
            if (error.message === "UNAUTHORIZED_JOB_MODIFICATION") {
                res.status(403).json({ error: "Unauthorized to modify this job post" });
                return;
            }
        }
        next(error);
    }
}

export async function deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const userId = req.apiUser!.id;
        const role = req.apiUser!.role;

        await JobService.deleteJob(id, userId, role);
        res.status(200).json({ message: "Job post deleted successfully" });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "JOB_NOT_FOUND") {
                res.status(404).json({ error: "Job post not found" });
                return;
            }
            if (error.message === "UNAUTHORIZED_JOB_DELETION") {
                res.status(403).json({ error: "Unauthorized to delete this job post" });
                return;
            }
        }
        next(error);
    }
}
