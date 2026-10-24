import * as JobModel from "../model/job.model.js";
import { UserRole } from "../enums/user.role.js";
import { JobStatus, JobType } from "../enums/job.types.js";
import type {
    CreateJobInput,
    JobFilterOptions,
    JobPostItem,
    UpdateJobInput,
} from "../types/job.types.js";

export async function createJob(input: CreateJobInput): Promise<number> {
    if (!input.title || input.title.trim().length === 0) {
        throw new Error("TITLE_REQUIRED");
    }
    if (!input.company || input.company.trim().length === 0) {
        throw new Error("COMPANY_REQUIRED");
    }
    if (!input.location || input.location.trim().length === 0) {
        throw new Error("LOCATION_REQUIRED");
    }
    if (!input.description || input.description.trim().length === 0) {
        throw new Error("DESCRIPTION_REQUIRED");
    }
    if (!input.applyUrlOrEmail || input.applyUrlOrEmail.trim().length === 0) {
        throw new Error("APPLY_INFO_REQUIRED");
    }
    if (!Object.values(JobType).includes(input.jobType)) {
        throw new Error("INVALID_JOB_TYPE");
    }

    return JobModel.create(input);
}

export async function getJobById(id: number): Promise<JobPostItem | null> {
    return JobModel.findById(id);
}

export async function updateJob(
    jobId: number,
    userId: number,
    userRole: UserRole,
    data: UpdateJobInput
): Promise<void> {
    const job = await JobModel.findById(jobId);
    if (!job) {
        throw new Error("JOB_NOT_FOUND");
    }

    // Ownership check: only original poster or admin can modify
    if (job.postedBy !== userId && userRole !== UserRole.ADMIN) {
        throw new Error("UNAUTHORIZED_JOB_MODIFICATION");
    }

    if (data.jobType && !Object.values(JobType).includes(data.jobType)) {
        throw new Error("INVALID_JOB_TYPE");
    }
    if (data.status && !Object.values(JobStatus).includes(data.status)) {
        throw new Error("INVALID_JOB_STATUS");
    }

    await JobModel.update(jobId, data);
}

export async function deleteJob(
    jobId: number,
    userId: number,
    userRole: UserRole
): Promise<void> {
    const job = await JobModel.findById(jobId);
    if (!job) {
        throw new Error("JOB_NOT_FOUND");
    }

    if (job.postedBy !== userId && userRole !== UserRole.ADMIN) {
        throw new Error("UNAUTHORIZED_JOB_DELETION");
    }

    await JobModel.deleteJob(jobId);
}

export async function listJobs(
    options: JobFilterOptions & { postedBy?: number }
): Promise<{ jobs: JobPostItem[]; total: number }> {
    return JobModel.list(options);
}
