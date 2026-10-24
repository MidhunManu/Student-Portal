import { pool } from "../config/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { ConnectionStatus } from "../enums/connection.status.js";
import type { AlumniConnectionItem } from "../types/alumni.types.js";

interface ConnectionRow extends RowDataPacket {
    id: number;
    requesterId: number;
    recipientId: number;
    status: ConnectionStatus;
    createdAt: Date;
    updatedAt: Date;
    otherUserId: number;
    otherUserName: string;
    otherUserEmail: string;
    otherCompany: string | null;
    otherRole: string | null;
    otherGraduationYear: number | null;
    otherDegree: string | null;
}

export async function findConnectionBetween(
    userA: number,
    userB: number
): Promise<{ id: number; requesterId: number; recipientId: number; status: ConnectionStatus } | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, requester_id AS requesterId, recipient_id AS recipientId, status
         FROM alumni_connections
         WHERE (requester_id = ? AND recipient_id = ?)
            OR (requester_id = ? AND recipient_id = ?)`,
        [userA, userB, userB, userA]
    );

    const r = rows[0];
    if (!r) return null;

    return {
        id: r.id,
        requesterId: r.requesterId,
        recipientId: r.recipientId,
        status: r.status,
    };
}

export async function findById(id: number): Promise<{ id: number; requesterId: number; recipientId: number; status: ConnectionStatus } | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, requester_id AS requesterId, recipient_id AS recipientId, status
         FROM alumni_connections
         WHERE id = ?`,
        [id]
    );

    const r = rows[0];
    if (!r) return null;

    return {
        id: r.id,
        requesterId: r.requesterId,
        recipientId: r.recipientId,
        status: r.status,
    };
}

export async function sendRequest(requesterId: number, recipientId: number): Promise<number> {
    const existing = await findConnectionBetween(requesterId, recipientId);
    if (existing) {
        if (existing.status === ConnectionStatus.ACCEPTED) {
            throw new Error("ALREADY_CONNECTED");
        }
        if (existing.status === ConnectionStatus.PENDING) {
            throw new Error("REQUEST_ALREADY_PENDING");
        }
        // If previously REJECTED, update to PENDING with new requester
        await pool.execute(
            `UPDATE alumni_connections
             SET requester_id = ?, recipient_id = ?, status = 'PENDING', updated_at = NOW()
             WHERE id = ?`,
            [requesterId, recipientId, existing.id]
        );
        return existing.id;
    }

    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO alumni_connections (requester_id, recipient_id, status)
         VALUES (?, ?, 'PENDING')`,
        [requesterId, recipientId]
    );

    return result.insertId;
}

export async function updateStatus(
    connectionId: number,
    status: ConnectionStatus
): Promise<void> {
    await pool.execute(
        `UPDATE alumni_connections SET status = ?, updated_at = NOW() WHERE id = ?`,
        [status, connectionId]
    );
}

export async function removeConnection(connectionId: number): Promise<void> {
    await pool.execute(`DELETE FROM alumni_connections WHERE id = ?`, [connectionId]);
}

export async function listUserConnections(userId: number): Promise<{
    connections: AlumniConnectionItem[];
    pendingReceived: AlumniConnectionItem[];
    pendingSent: AlumniConnectionItem[];
}> {
    const [rows] = await pool.execute<ConnectionRow[]>(
        `SELECT c.id, c.requester_id AS requesterId, c.recipient_id AS recipientId, c.status,
                c.created_at AS createdAt, c.updated_at AS updatedAt,
                CASE WHEN c.requester_id = ? THEN u2.id ELSE u1.id END AS otherUserId,
                CASE WHEN c.requester_id = ? THEN u2.name ELSE u1.name END AS otherUserName,
                CASE WHEN c.requester_id = ? THEN u2.email ELSE u1.email END AS otherUserEmail,
                CASE WHEN c.requester_id = ? THEN p2.company ELSE p1.company END AS otherCompany,
                CASE WHEN c.requester_id = ? THEN p2.role ELSE p1.role END AS otherRole,
                CASE WHEN c.requester_id = ? THEN p2.graduation_year ELSE p1.graduation_year END AS otherGraduationYear,
                CASE WHEN c.requester_id = ? THEN p2.degree ELSE p1.degree END AS otherDegree
         FROM alumni_connections c
         JOIN users u1 ON c.requester_id = u1.id
         JOIN users u2 ON c.recipient_id = u2.id
         LEFT JOIN alumni_profiles p1 ON u1.id = p1.user_id
         LEFT JOIN alumni_profiles p2 ON u2.id = p2.user_id
         WHERE c.requester_id = ? OR c.recipient_id = ?
         ORDER BY c.updated_at DESC`,
        [userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );

    const connections: AlumniConnectionItem[] = [];
    const pendingReceived: AlumniConnectionItem[] = [];
    const pendingSent: AlumniConnectionItem[] = [];

    for (const r of rows) {
        const item: AlumniConnectionItem = {
            id: r.id,
            requesterId: r.requesterId,
            recipientId: r.recipientId,
            status: r.status,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            otherUserId: r.otherUserId,
            otherUserName: r.otherUserName,
            otherUserEmail: r.otherUserEmail,
            otherCompany: r.otherCompany,
            otherRole: r.role,
            otherGraduationYear: r.otherGraduationYear ? Number(r.otherGraduationYear) : null,
            otherDegree: r.otherDegree,
            isRequester: r.requesterId === userId,
        };

        if (r.status === ConnectionStatus.ACCEPTED) {
            connections.push(item);
        } else if (r.status === ConnectionStatus.PENDING) {
            if (r.recipientId === userId) {
                pendingReceived.push(item);
            } else {
                pendingSent.push(item);
            }
        }
    }

    return { connections, pendingReceived, pendingSent };
}
