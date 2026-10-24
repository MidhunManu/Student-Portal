import { pool } from "../config/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { CreateUserInput } from "../types/user.types.js";
import type { UserRole } from "../enums/user.role.js";

interface UserRow extends RowDataPacket {
    id: number,
    name: string,
    email: string,
    collegeId: number,
    role: UserRole,
    passwordHash: string,
    createdAt: Date,
}

export async function findByEmail(email: string) {
    const [rows] = await pool.execute<UserRow[]>(
        `SELECT id, email, college_id, role, password_hash, created_at
         FROM users
         WHERE email = ?`,
         [email]
    );

    return rows[0] ?? null;
}

export async function create(user: CreateUserInput) {
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO users (name, email, college_id, role, password_hash)
        values (?, ?, ?, ?,?)`,
        [user.name, user.email, user.collegeId, user.role, user.password]
    );

    return result.insertId;
}
