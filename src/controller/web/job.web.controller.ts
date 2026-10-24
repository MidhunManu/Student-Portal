import type { Request, Response, NextFunction } from "express";
import * as JobService from "../../service/job.service.js";
import { JobStatus, JobType } from "../../enums/job.types.js";
import { UserRole } from "../../enums/user.role.js";

export async function renderJobList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const search = req.query.search as string | undefined;
        const jobType = req.query.jobType as any || "ALL";

        const result = await JobService.listJobs({
            search,
            jobType,
            status: JobStatus.ACTIVE,
            page,
            limit: 10,
        });

        res.render("jobs/index", {
            title: "Career & Job Opportunities - Apex Portal",
            jobs: result.jobs,
            total: result.total,
            currentPage: page,
            totalPages: Math.ceil(result.total / 10),
            query: req.query,
            jobTypes: Object.values(JobType),
        });
    } catch (error) {
        next(error);
    }
}

export async function renderJobDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const job = await JobService.getJobById(id);
        if (!job) {
            res.status(404);
            return res.render("errors/404", {
                title: "Job Not Found",
                message: "The requested job post could not be found.",
            });
        }

        const isOwner = req.session?.user?.id === job.postedBy;
        const isAdmin = req.session?.user?.role === UserRole.ADMIN;

        res.render("jobs/show", {
            title: `${job.title} at ${job.company} - Apex Careers`,
            job,
            canManage: isOwner || isAdmin,
        });
    } catch (error) {
        next(error);
    }
}

export async function renderMyJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.session.user!.id;
        const result = await JobService.listJobs({
            postedBy: userId,
            limit: 50,
        });

        res.render("jobs/my", {
            title: "My Posted Jobs - Apex Portal",
            jobs: result.jobs,
        });
    } catch (error) {
        next(error);
    }
}

export async function renderNewJobForm(req: Request, res: Response): Promise<void> {
    res.render("jobs/form", {
        title: "Post New Career Opportunity - Apex Portal",
        job: null,
        isEdit: false,
        jobTypes: Object.values(JobType),
    });
}

export async function handleCreateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.session.user!.id;
        await JobService.createJob({
            postedBy: userId,
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            jobType: req.body.jobType as JobType,
            description: req.body.description,
            requirements: req.body.requirements,
            applyUrlOrEmail: req.body.applyUrlOrEmail,
        });

        req.session.flash = { success: "Job opportunity posted successfully." };
        res.redirect("/jobs/my");
    } catch (error) {
        if (error instanceof Error) {
            req.session.flash = { error: `Failed to post job: ${error.message}` };
            return res.redirect("/jobs/new");
        }
        next(error);
    }
}

export async function renderEditJobForm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const job = await JobService.getJobById(id);
        if (!job) {
            req.session.flash = { error: "Job post not found" };
            return res.redirect("/jobs");
        }

        const isOwner = req.session.user!.id === job.postedBy;
        const isAdmin = req.session.user!.role === UserRole.ADMIN;
        if (!isOwner && !isAdmin) {
            res.status(403);
            return res.render("errors/403", {
                title: "403 Forbidden",
                message: "You can only edit job posts that you created.",
            });
        }

        res.render("jobs/form", {
            title: `Edit Job: ${job.title}`,
            job,
            isEdit: true,
            jobTypes: Object.values(JobType),
            statuses: Object.values(JobStatus),
        });
    } catch (error) {
        next(error);
    }
}

export async function handleEditJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const userId = req.session.user!.id;
        const role = req.session.user!.role;

        await JobService.updateJob(id, userId, role, {
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            jobType: req.body.jobType as JobType,
            description: req.body.description,
            requirements: req.body.requirements,
            applyUrlOrEmail: req.body.applyUrlOrEmail,
            status: req.body.status as JobStatus,
        });

        req.session.flash = { success: "Job post updated successfully." };
        res.redirect(`/jobs/${id}`);
    } catch (error) {
        if (error instanceof Error) {
            req.session.flash = { error: `Failed to update job: ${error.message}` };
            return res.redirect(`/jobs/${req.params.id}/edit`);
        }
        next(error);
    }
}

export async function handleDeleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const userId = req.session.user!.id;
        const role = req.session.user!.role;

        await JobService.deleteJob(id, userId, role);
        req.session.flash = { success: "Job post removed successfully." };
        res.redirect("/jobs/my");
    } catch (error) {
        next(error);
    }
}
