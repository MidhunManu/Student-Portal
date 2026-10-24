import { pool } from "../config/db.js";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { EventRegistrationItem } from "../types/event.types.js";
import { RegistrationStatus } from "../enums/registration.status.js";

interface RegistrationRow extends RowDataPacket {
    id: number;
    eventId: number;
    userId: number;
    status: RegistrationStatus;
    createdAt: Date;
    updatedAt: Date;
    eventTitle?: string;
    eventDate?: Date;
    location?: string;
    userName?: string;
    userEmail?: string;
}

export async function findByEventAndUser(
    eventId: number,
    userId: number,
    conn?: PoolConnection
): Promise<EventRegistrationItem | null> {
    const executor = conn ?? pool;
    const [rows] = await executor.execute<RegistrationRow[]>(
        `SELECT id, event_id AS eventId, user_id AS userId, status,
                created_at AS createdAt, updated_at AS updatedAt
         FROM event_registrations
         WHERE event_id = ? AND user_id = ?`,
        [eventId, userId]
    );

    const r = rows[0];
    if (!r) return null;

    return {
        id: r.id,
        eventId: r.eventId,
        userId: r.userId,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}

export async function findById(id: number): Promise<EventRegistrationItem | null> {
    const [rows] = await pool.execute<RegistrationRow[]>(
        `SELECT r.id, r.event_id AS eventId, r.user_id AS userId, r.status,
                r.created_at AS createdAt, r.updated_at AS updatedAt,
                e.title AS eventTitle, e.event_date AS eventDate, e.location
         FROM event_registrations r
         JOIN events e ON r.event_id = e.id
         WHERE r.id = ?`,
        [id]
    );

    const r = rows[0];
    if (!r) return null;

    return {
        id: r.id,
        eventId: r.eventId,
        userId: r.userId,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        eventTitle: r.eventTitle,
        eventDate: r.eventDate,
        location: r.location,
    };
}

export async function listByUser(userId: number): Promise<EventRegistrationItem[]> {
    const [rows] = await pool.execute<RegistrationRow[]>(
        `SELECT r.id, r.event_id AS eventId, r.user_id AS userId, r.status,
                r.created_at AS createdAt, r.updated_at AS updatedAt,
                e.title AS eventTitle, e.event_date AS eventDate, e.location
         FROM event_registrations r
         JOIN events e ON r.event_id = e.id
         WHERE r.user_id = ?
         ORDER BY e.event_date ASC`,
        [userId]
    );

    return rows.map((r) => ({
        id: r.id,
        eventId: r.eventId,
        userId: r.userId,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        eventTitle: r.eventTitle,
        eventDate: r.eventDate,
        location: r.location,
    }));
}

export async function listByEvent(eventId: number): Promise<EventRegistrationItem[]> {
    const [rows] = await pool.execute<RegistrationRow[]>(
        `SELECT r.id, r.event_id AS eventId, r.user_id AS userId, r.status,
                r.created_at AS createdAt, r.updated_at AS updatedAt,
                u.name AS userName, u.email AS userEmail
         FROM event_registrations r
         JOIN users u ON r.user_id = u.id
         WHERE r.event_id = ?
         ORDER BY r.created_at ASC`,
        [eventId]
    );

    return rows.map((r) => ({
        id: r.id,
        eventId: r.eventId,
        userId: r.userId,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userName: r.userName,
        userEmail: r.userEmail,
    }));
}

export async function countTotal(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM event_registrations"
    );
    return Number(rows[0]?.total ?? 0);
}

/**
 * Atomic Registration with Capacity and Waitlist Enforcement:
 * 1. Locks the event row with FOR UPDATE.
 * 2. Checks registration deadline and event status.
 * 3. Checks if user is already confirmed or waitlisted.
 * 4. Checks current confirmed count.
 * 5. If under capacity -> CONFIRMED, else WAITLISTED.
 */
export async function registerForEvent(
    eventId: number,
    userId: number
): Promise<{ registrationId: number; status: RegistrationStatus }> {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Lock event
        const [eventRows] = await conn.execute<RowDataPacket[]>(
            `SELECT id, status, registration_deadline AS registrationDeadline, capacity
             FROM events
             WHERE id = ? FOR UPDATE`,
            [eventId]
        );
        const event = eventRows[0];
        if (!event) {
            throw new Error("EVENT_NOT_FOUND");
        }

        if (event.status !== "UPCOMING") {
            throw new Error("EVENT_NOT_OPEN");
        }

        const now = new Date();
        const deadline = new Date(event.registrationDeadline);
        if (deadline < now) {
            throw new Error("REGISTRATION_DEADLINE_PASSED");
        }

        // 2. Lock user's existing registration for this event if any
        const [existingRegs] = await conn.execute<RowDataPacket[]>(
            `SELECT id, status FROM event_registrations
             WHERE event_id = ? AND user_id = ? FOR UPDATE`,
            [eventId, userId]
        );
        const existing = existingRegs[0];
        if (existing && (existing.status === RegistrationStatus.CONFIRMED || existing.status === RegistrationStatus.WAITLISTED)) {
            throw new Error("ALREADY_REGISTERED");
        }

        // 3. Count confirmed seats
        const [countRows] = await conn.execute<RowDataPacket[]>(
            `SELECT COUNT(*) AS confirmedCount
             FROM event_registrations
             WHERE event_id = ? AND status = 'CONFIRMED' FOR UPDATE`,
            [eventId]
        );
        const confirmedCount = Number(countRows[0]?.confirmedCount ?? 0);
        const capacity = Number(event.capacity);

        const newStatus = confirmedCount < capacity
            ? RegistrationStatus.CONFIRMED
            : RegistrationStatus.WAITLISTED;

        let registrationId: number;

        if (existing) {
            // Re-activating a previously cancelled registration
            await conn.execute(
                `UPDATE event_registrations
                 SET status = ?, updated_at = NOW()
                 WHERE id = ?`,
                [newStatus, existing.id]
            );
            registrationId = existing.id;
        } else {
            const [insertRes] = await conn.execute<ResultSetHeader>(
                `INSERT INTO event_registrations (event_id, user_id, status)
                 VALUES (?, ?, ?)`,
                [eventId, userId, newStatus]
            );
            registrationId = insertRes.insertId;
        }

        await conn.commit();
        return { registrationId, status: newStatus };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

/**
 * Atomic Cancellation and Waitlist Promotion:
 * 1. Locks the registration row.
 * 2. If CONFIRMED, marks CANCELLED and promotes the earliest WAITLISTED user.
 */
export async function cancelRegistration(
    eventId: number,
    userId: number
): Promise<{ cancelled: boolean; promotedUserId: number | null }> {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Lock user registration
        const [regRows] = await conn.execute<RowDataPacket[]>(
            `SELECT id, status
             FROM event_registrations
             WHERE event_id = ? AND user_id = ? FOR UPDATE`,
            [eventId, userId]
        );
        const reg = regRows[0];
        if (!reg) {
            throw new Error("REGISTRATION_NOT_FOUND");
        }

        if (reg.status === RegistrationStatus.CANCELLED) {
            throw new Error("ALREADY_CANCELLED");
        }

        const wasConfirmed = reg.status === RegistrationStatus.CONFIRMED;

        // Mark current as CANCELLED
        await conn.execute(
            `UPDATE event_registrations
             SET status = 'CANCELLED', updated_at = NOW()
             WHERE id = ?`,
            [reg.id]
        );

        let promotedUserId: number | null = null;

        // 2. If confirmed seat was vacated, promote next waitlisted user
        if (wasConfirmed) {
            const [waitlistedRows] = await conn.execute<RowDataPacket[]>(
                `SELECT id, user_id AS userId
                 FROM event_registrations
                 WHERE event_id = ? AND status = 'WAITLISTED'
                 ORDER BY created_at ASC
                 LIMIT 1 FOR UPDATE`,
                [eventId]
            );

            const nextInLine = waitlistedRows[0];
            if (nextInLine) {
                await conn.execute(
                    `UPDATE event_registrations
                     SET status = 'CONFIRMED', updated_at = NOW()
                     WHERE id = ?`,
                    [nextInLine.id]
                );
                promotedUserId = Number(nextInLine.userId);
            }
        }

        await conn.commit();
        return { cancelled: true, promotedUserId };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}
