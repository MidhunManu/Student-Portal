import { pool } from "../config/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { CreateJobInput, JobFilterOptions, JobPostItem, UpdateJobInput } from "../types/job.types.js";
import { JobStatus, JobType } from "../enums/job.types.js";

interface JobRow extends RowDataPacket {
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
    posterName?: string;
    posterEmail?: string;
}

export async function create(job: CreateJobInput): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO job_posts (posted_by, title, company, location, job_type, description, requirements, apply_url_or_email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [
            job.postedBy,
            job.title.trim(),
            job.company.trim(),
            job.location.trim(),
            job.jobType,
            job.description.trim(),
            job.requirements?.trim() ?? null,
            job.applyUrlOrEmail.trim(),
        ]
    );

    return result.insertId;
}

export async function findById(id: number): Promise<JobPostItem | null> {
    const [rows] = await pool.execute<JobRow[]>(
        `SELECT j.id, j.posted_by AS postedBy, j.title, j.company, j.location,
                j.job_type AS jobType, j.description, j.requirements,
                j.apply_url_or_email AS applyUrlOrEmail, j.status,
                j.created_at AS createdAt, j.updated_at AS updatedAt,
                u.name AS posterName, u.email AS posterEmail
         FROM job_posts j
         JOIN users u ON j.posted_by = u.id
         WHERE j.id = ?`,
        [id]
    );

    const r = rows[0];
    if (!r) return null;

    return {
        id: r.id,
        postedBy: r.postedBy,
        title: r.title,
        company: r.company,
        location: r.location,
        jobType: r.jobType,
        description: r.description,
        requirements: r.requirements,
        applyUrlOrEmail: r.applyUrlOrEmail,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        posterName: r.posterName,
        posterEmail: r.posterEmail,
    };
}

export async function update(id: number, data: UpdateJobInput): Promise<void> {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.title !== undefined) {
        fields.push("title = ?");
        values.push(data.title.trim());
    }
    if (data.company !== undefined) {
        fields.push("company = ?");
        values.push(data.company.trim());
    }
    if (data.location !== undefined) {
        fields.push("location = ?");
        values.push(data.location.trim());
    }
    if (data.jobType !== undefined) {
        fields.push("job_type = ?");
        values.push(data.jobType);
    }
    if (data.description !== undefined) {
        fields.push("description = ?");
        values.push(data.description.trim());
    }
    if (data.requirements !== undefined) {
        fields.push("requirements = ?");
        values.push(data.requirements?.trim() ?? "");
    }
    if (data.applyUrlOrEmail !== undefined) {
        fields.push("apply_url_or_email = ?");
        values.push(data.applyUrlOrEmail.trim());
    }
    if (data.status !== undefined) {
        fields.push("status = ?");
        values.push(data.status);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
        `UPDATE job_posts SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
        values
    );
}

export async function deleteJob(id: number): Promise<void> {
    await pool.execute("DELETE FROM job_posts WHERE id = ?", [id]);
}

export async function list(options: JobFilterOptions & { postedBy?: number }): Promise<{ jobs: JobPostItem[]; total: number }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, Math.min(100, options.limit ?? 10));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (options.postedBy) {
        whereClauses.push("j.posted_by = ?");
        params.push(options.postedBy);
    }

    if (options.status && options.status !== "ALL") {
        whereClauses.push("j.status = ?");
        params.push(options.status);
    }

    if (options.jobType && options.jobType !== "ALL") {
        whereClauses.push("j.job_type = ?");
        params.push(options.jobType);
    }

    if (options.company && options.company.trim() !== "") {
        whereClauses.push("j.company LIKE ?");
        params.push(`%${options.company.trim()}%`);
    }

    if (options.search && options.search.trim() !== "") {
        whereClauses.push("(j.title LIKE ? OR j.company LIKE ? OR j.location LIKE ? OR j.description LIKE ?)");
        const searchPattern = `%${options.search.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM job_posts j ${whereSql}`,
        params
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await pool.query<JobRow[]>(
        `SELECT j.id, j.posted_by AS postedBy, j.title, j.company, j.location,
                j.job_type AS jobType, j.description, j.requirements,
                j.apply_url_or_email AS applyUrlOrEmail, j.status,
                j.created_at AS createdAt, j.updated_at AS updatedAt,
                u.name AS posterName, u.email AS posterEmail
         FROM job_posts j
         JOIN users u ON j.posted_by = u.id
         ${whereSql}
         ORDER BY j.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const jobs: JobPostItem[] = rows.map((r) => ({
        id: r.id,
        postedBy: r.postedBy,
        title: r.title,
        company: r.company,
        location: r.location,
        jobType: r.jobType,
        description: r.description,
        requirements: r.requirements,
        applyUrlOrEmail: r.applyUrlOrEmail,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        posterName: r.posterName,
        posterEmail: r.posterEmail,
    }));

    return { jobs, total };
}

export async function countActive(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM job_posts WHERE status = 'ACTIVE'"
    );
    return Number(rows[0]?.total ?? 0);
}
