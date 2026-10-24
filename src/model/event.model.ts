import { pool } from "../config/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { CreateEventInput, EventFilterOptions, EventItem, UpdateEventInput } from "../types/event.types.js";
import type { EventStatus } from "../enums/event.status.js";

interface EventRow extends RowDataPacket {
    id: number;
    title: string;
    description: string;
    location: string;
    eventDate: Date;
    registrationDeadline: Date;
    capacity: number;
    status: EventStatus;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
    confirmedCount: number;
    waitlistedCount: number;
}

export async function create(event: CreateEventInput): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO events (title, description, location, event_date, registration_deadline, capacity, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'UPCOMING', ?)`,
        [
            event.title.trim(),
            event.description.trim(),
            event.location.trim(),
            event.eventDate,
            event.registrationDeadline,
            event.capacity,
            event.createdBy,
        ]
    );

    return result.insertId;
}

export async function findById(id: number): Promise<EventItem | null> {
    const [rows] = await pool.execute<EventRow[]>(
        `SELECT e.id, e.title, e.description, e.location,
                e.event_date AS eventDate,
                e.registration_deadline AS registrationDeadline,
                e.capacity, e.status, e.created_by AS createdBy,
                e.created_at AS createdAt, e.updated_at AS updatedAt,
                COALESCE(SUM(CASE WHEN r.status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) AS confirmedCount,
                COALESCE(SUM(CASE WHEN r.status = 'WAITLISTED' THEN 1 ELSE 0 END), 0) AS waitlistedCount
         FROM events e
         LEFT JOIN event_registrations r ON e.id = r.event_id
         WHERE e.id = ?
         GROUP BY e.id`,
        [id]
    );

    const row = rows[0];
    if (!row) return null;

    return {
        id: row.id,
        title: row.title,
        description: row.description,
        location: row.location,
        eventDate: row.eventDate,
        registrationDeadline: row.registrationDeadline,
        capacity: Number(row.capacity),
        status: row.status,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        confirmedCount: Number(row.confirmedCount),
        waitlistedCount: Number(row.waitlistedCount),
    };
}

export async function update(id: number, data: UpdateEventInput): Promise<void> {
    const fields: string[] = [];
    const values: (string | number | Date)[] = [];

    if (data.title !== undefined) {
        fields.push("title = ?");
        values.push(data.title.trim());
    }
    if (data.description !== undefined) {
        fields.push("description = ?");
        values.push(data.description.trim());
    }
    if (data.location !== undefined) {
        fields.push("location = ?");
        values.push(data.location.trim());
    }
    if (data.eventDate !== undefined) {
        fields.push("event_date = ?");
        values.push(data.eventDate);
    }
    if (data.registrationDeadline !== undefined) {
        fields.push("registration_deadline = ?");
        values.push(data.registrationDeadline);
    }
    if (data.capacity !== undefined) {
        fields.push("capacity = ?");
        values.push(data.capacity);
    }
    if (data.status !== undefined) {
        fields.push("status = ?");
        values.push(data.status);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
        `UPDATE events SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
        values
    );
}

export async function list(options: EventFilterOptions): Promise<{ events: EventItem[]; total: number }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, Math.min(100, options.limit ?? 10));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: (string | number | Date)[] = [];

    if (options.upcomingOnly) {
        whereClauses.push("e.event_date >= NOW()");
    }

    if (options.status && options.status !== "ALL") {
        whereClauses.push("e.status = ?");
        params.push(options.status);
    }

    if (options.search && options.search.trim() !== "") {
        whereClauses.push("(e.title LIKE ? OR e.location LIKE ? OR e.description LIKE ?)");
        const searchPattern = `%${options.search.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT e.id) AS total FROM events e ${whereSql}`,
        params
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await pool.query<EventRow[]>(
        `SELECT e.id, e.title, e.description, e.location,
                e.event_date AS eventDate,
                e.registration_deadline AS registrationDeadline,
                e.capacity, e.status, e.created_by AS createdBy,
                e.created_at AS createdAt, e.updated_at AS updatedAt,
                COALESCE(SUM(CASE WHEN r.status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) AS confirmedCount,
                COALESCE(SUM(CASE WHEN r.status = 'WAITLISTED' THEN 1 ELSE 0 END), 0) AS waitlistedCount
         FROM events e
         LEFT JOIN event_registrations r ON e.id = r.event_id
         ${whereSql}
         GROUP BY e.id
         ORDER BY e.event_date ASC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const events: EventItem[] = rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        location: row.location,
        eventDate: row.eventDate,
        registrationDeadline: row.registrationDeadline,
        capacity: Number(row.capacity),
        status: row.status,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        confirmedCount: Number(row.confirmedCount),
        waitlistedCount: Number(row.waitlistedCount),
    }));

    return { events, total };
}

export async function countTotal(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM events");
    return Number(rows[0]?.total ?? 0);
}

export async function countUpcoming(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM events WHERE status = 'UPCOMING' AND event_date >= NOW()"
    );
    return Number(rows[0]?.total ?? 0);
}
