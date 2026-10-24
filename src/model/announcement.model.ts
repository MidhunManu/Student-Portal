import { pool } from "../config/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type {
    AnnouncementFilterOptions,
    AnnouncementItem,
    CreateAnnouncementInput,
    UpdateAnnouncementInput,
} from "../types/announcement.types.js";
import { AnnouncementCategory, AnnouncementStatus } from "../enums/announcement.status.js";

interface AnnouncementRow extends RowDataPacket {
    id: number;
    title: string;
    content: string;
    category: AnnouncementCategory;
    status: AnnouncementStatus;
    publishedAt: Date | null;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
    authorName?: string;
}

export async function create(announcement: CreateAnnouncementInput): Promise<number> {
    const publishedAt = announcement.status === AnnouncementStatus.PUBLISHED ? new Date() : null;

    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO announcements (title, content, category, status, published_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            announcement.title.trim(),
            announcement.content.trim(),
            announcement.category,
            announcement.status,
            publishedAt,
            announcement.createdBy,
        ]
    );

    return result.insertId;
}

export async function findById(id: number): Promise<AnnouncementItem | null> {
    const [rows] = await pool.execute<AnnouncementRow[]>(
        `SELECT a.id, a.title, a.content, a.category, a.status,
                a.published_at AS publishedAt, a.created_by AS createdBy,
                a.created_at AS createdAt, a.updated_at AS updatedAt,
                u.name AS authorName
         FROM announcements a
         JOIN users u ON a.created_by = u.id
         WHERE a.id = ?`,
        [id]
    );

    const r = rows[0];
    if (!r) return null;

    return {
        id: r.id,
        title: r.title,
        content: r.content,
        category: r.category,
        status: r.status,
        publishedAt: r.publishedAt,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        authorName: r.authorName,
    };
}

export async function update(id: number, data: UpdateAnnouncementInput): Promise<void> {
    const fields: string[] = [];
    const values: (string | Date | null)[] = [];

    if (data.title !== undefined) {
        fields.push("title = ?");
        values.push(data.title.trim());
    }
    if (data.content !== undefined) {
        fields.push("content = ?");
        values.push(data.content.trim());
    }
    if (data.category !== undefined) {
        fields.push("category = ?");
        values.push(data.category);
    }
    if (data.status !== undefined) {
        fields.push("status = ?");
        values.push(data.status);

        if (data.status === AnnouncementStatus.PUBLISHED) {
            fields.push("published_at = COALESCE(published_at, NOW())");
        }
    }

    if (fields.length === 0) return;

    values.push(String(id));
    await pool.execute(
        `UPDATE announcements SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
        values
    );
}

export async function deleteAnnouncement(id: number): Promise<void> {
    await pool.execute("DELETE FROM announcements WHERE id = ?", [id]);
}

export async function list(
    options: AnnouncementFilterOptions
): Promise<{ announcements: AnnouncementItem[]; total: number }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, Math.min(100, options.limit ?? 10));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (options.status && options.status !== "ALL") {
        whereClauses.push("a.status = ?");
        params.push(options.status);
    }

    if (options.category && options.category !== "ALL") {
        whereClauses.push("a.category = ?");
        params.push(options.category);
    }

    if (options.search && options.search.trim() !== "") {
        whereClauses.push("(a.title LIKE ? OR a.content LIKE ?)");
        const searchPattern = `%${options.search.trim()}%`;
        params.push(searchPattern, searchPattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM announcements a ${whereSql}`,
        params
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await pool.query<AnnouncementRow[]>(
        `SELECT a.id, a.title, a.content, a.category, a.status,
                a.published_at AS publishedAt, a.created_by AS createdBy,
                a.created_at AS createdAt, a.updated_at AS updatedAt,
                u.name AS authorName
         FROM announcements a
         JOIN users u ON a.created_by = u.id
         ${whereSql}
         ORDER BY COALESCE(a.published_at, a.created_at) DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const announcements: AnnouncementItem[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        category: r.category,
        status: r.status,
        publishedAt: r.publishedAt,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        authorName: r.authorName,
    }));

    return { announcements, total };
}

export async function countPublished(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM announcements WHERE status = 'PUBLISHED'"
    );
    return Number(rows[0]?.total ?? 0);
}
