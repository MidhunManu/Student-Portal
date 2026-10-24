import { pool } from "../config/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { CreateUserInput, User } from "../types/user.types.js";
import type { UserRole } from "../enums/user.role.js";

interface UserRow extends RowDataPacket {
    id: number;
    name: string;
    email: string;
    collegeId: number | null;
    role: UserRole;
    passwordHash: string;
    createdAt: Date;
    isVerified: number;
    refreshToken: string | null;
}

export async function findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
        `SELECT id, name, email, college_id AS collegeId, role,
                password_hash AS passwordHash, created_at AS createdAt,
                is_verified AS isVerified, refresh_token AS refreshToken
         FROM users
         WHERE email = ?`,
        [email.trim().toLowerCase()]
    );

    const row = rows[0];
    if (!row) return null;

    return {
        id: row.id,
        name: row.name,
        email: row.email,
        collegeId: row.collegeId,
        role: row.role,
        passwordHash: row.passwordHash,
        createdAt: row.createdAt,
        isVerified: Boolean(row.isVerified),
        refreshToken: row.refreshToken,
    };
}

export async function findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
        `SELECT id, name, email, college_id AS collegeId, role,
                password_hash AS passwordHash, created_at AS createdAt,
                is_verified AS isVerified, refresh_token AS refreshToken
         FROM users
         WHERE id = ?`,
        [id]
    );

    const row = rows[0];
    if (!row) return null;

    return {
        id: row.id,
        name: row.name,
        email: row.email,
        collegeId: row.collegeId,
        role: row.role,
        passwordHash: row.passwordHash,
        createdAt: row.createdAt,
        isVerified: Boolean(row.isVerified),
        refreshToken: row.refreshToken,
    };
}

export async function create(user: CreateUserInput): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO users (name, email, college_id, role, password_hash, is_verified)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [
            user.name.trim(),
            user.email.trim().toLowerCase(),
            user.collegeId ?? null,
            user.role,
            user.password,
        ]
    );

    return result.insertId;
}

export async function updateRefreshToken(id: number, token: string | null): Promise<void> {
    await pool.execute(
        `UPDATE users SET refresh_token = ? WHERE id = ?`,
        [token, id]
    );
}

export async function updateRole(id: number, role: UserRole): Promise<void> {
    await pool.execute(
        `UPDATE users SET role = ? WHERE id = ?`,
        [role, id]
    );
}

export async function listUsers(options: {
    search?: string | undefined;
    role?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}): Promise<{ users: User[]; total: number }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, Math.min(100, options.limit ?? 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (options.search && options.search.trim() !== "") {
        whereClauses.push("(name LIKE ? OR email LIKE ?)");
        params.push(`%${options.search.trim()}%`, `%${options.search.trim()}%`);
    }

    if (options.role && options.role.trim() !== "" && options.role !== "ALL") {
        whereClauses.push("role = ?");
        params.push(options.role.trim());
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM users ${whereSql}`,
        params
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await pool.query<UserRow[]>(
        `SELECT id, name, email, college_id AS collegeId, role,
                password_hash AS passwordHash, created_at AS createdAt,
                is_verified AS isVerified, refresh_token AS refreshToken
         FROM users
         ${whereSql}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const users: User[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        collegeId: row.collegeId,
        role: row.role,
        passwordHash: row.passwordHash,
        createdAt: row.createdAt,
        isVerified: Boolean(row.isVerified),
        refreshToken: row.refreshToken,
    }));

    return { users, total };
}

export async function getCountsByRole(): Promise<Record<string, number>> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT role, COUNT(*) AS count FROM users GROUP BY role`
    );
    const counts: Record<string, number> = { STUDENT: 0, ALUMNI: 0, ADMIN: 0 };
    for (const r of rows) {
        if (r.role) counts[r.role] = Number(r.count);
    }
    return counts;
}
