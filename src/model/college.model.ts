import { pool } from "../config/db.js";
import type { RowDataPacket } from "mysql2";

export interface College {
    id: number;
    name: string;
    createdAt: Date;
}

export async function getAllColleges(): Promise<College[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, name, created_at AS createdAt FROM colleges ORDER BY name ASC"
    );
    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        createdAt: r.createdAt,
    }));
}

export async function findCollegeById(id: number): Promise<College | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id, name, created_at AS createdAt FROM colleges WHERE id = ?",
        [id]
    );
    const r = rows[0];
    if (!r) return null;
    return {
        id: r.id,
        name: r.name,
        createdAt: r.createdAt,
    };
}
