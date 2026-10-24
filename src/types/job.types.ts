import type { JobType, JobStatus } from "../enums/job.types.js";

export interface JobPostItem {
    id: number;
    postedBy: number;
    title: string;
    company: string;
    location: string;
    jobType: JobType;
    description: string;
    requirements: string | null;
    applyUrlOrEmail: string;
    status: JobStatus;
    createdAt: Date;
    updatedAt: Date;
    posterName?: string | undefined;
    posterEmail?: string | undefined;
}

export interface CreateJobInput {
    postedBy: number;
    title: string;
    company: string;
    location: string;
    jobType: JobType;
    description: string;
    requirements?: string | null | undefined;
    applyUrlOrEmail: string;
}

export interface UpdateJobInput {
    title?: string | undefined;
    company?: string | undefined;
    location?: string | undefined;
    jobType?: JobType | undefined;
    description?: string | undefined;
    requirements?: string | null | undefined;
    applyUrlOrEmail?: string | undefined;
    status?: JobStatus | undefined;
}

export interface JobFilterOptions {
    search?: string | undefined;
    jobType?: JobType | "ALL" | undefined;
    company?: string | undefined;
    status?: JobStatus | "ALL" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}
