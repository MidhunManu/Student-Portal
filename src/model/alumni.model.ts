import { pool } from "../config/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { AlumniDirectoryFilter, AlumniProfile, UpdateAlumniProfileInput } from "../types/alumni.types.js";

interface AlumniRow extends RowDataPacket {
    id: number;
    userId: number;
    graduationYear: number;
    degree: string;
    major: string;
    company: string | null;
    role: string | null;
    location: string | null;
    bio: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    userName?: string;
    userEmail?: string;
}

export async function findByUserId(userId: number): Promise<AlumniProfile | null> {
    const [rows] = await pool.execute<AlumniRow[]>(
        `SELECT p.id, p.user_id AS userId, p.graduation_year AS graduationYear,
                p.degree, p.major, p.company, p.role, p.location, p.bio,
                p.linkedin_url AS linkedinUrl, p.github_url AS githubUrl,
                p.created_at AS createdAt, p.updated_at AS updatedAt,
                u.name AS userName, u.email AS userEmail
         FROM alumni_profiles p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = ?`,
        [userId]
    );

    const r = rows[0];
    if (!r) return null;

    return {
        id: r.id,
        userId: r.userId,
        graduationYear: Number(r.graduationYear),
        degree: r.degree,
        major: r.major,
        company: r.company,
        role: r.role,
        location: r.location,
        bio: r.bio,
        linkedinUrl: r.linkedinUrl,
        githubUrl: r.githubUrl,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userName: r.userName,
        userEmail: r.userEmail,
    };
}

export async function findById(id: number): Promise<AlumniProfile | null> {
    const [rows] = await pool.execute<AlumniRow[]>(
        `SELECT p.id, p.user_id AS userId, p.graduation_year AS graduationYear,
                p.degree, p.major, p.company, p.role, p.location, p.bio,
                p.linkedin_url AS linkedinUrl, p.github_url AS githubUrl,
                p.created_at AS createdAt, p.updated_at AS updatedAt,
                u.name AS userName, u.email AS userEmail
         FROM alumni_profiles p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = ?`,
        [id]
    );

    const r = rows[0];
    if (!r) return null;

    return {
        id: r.id,
        userId: r.userId,
        graduationYear: Number(r.graduationYear),
        degree: r.degree,
        major: r.major,
        company: r.company,
        role: r.role,
        location: r.location,
        bio: r.bio,
        linkedinUrl: r.linkedinUrl,
        githubUrl: r.githubUrl,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userName: r.userName,
        userEmail: r.userEmail,
    };
}

export async function upsertProfile(
    userId: number,
    data: UpdateAlumniProfileInput
): Promise<void> {
    await pool.execute(
        `INSERT INTO alumni_profiles (user_id, graduation_year, degree, major, company, role, location, bio, linkedin_url, github_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            graduation_year = VALUES(graduation_year),
            degree = VALUES(degree),
            major = VALUES(major),
            company = VALUES(company),
            role = VALUES(role),
            location = VALUES(location),
            bio = VALUES(bio),
            linkedin_url = VALUES(linkedin_url),
            github_url = VALUES(github_url),
            updated_at = NOW()`,
        [
            userId,
            data.graduationYear,
            data.degree.trim(),
            data.major.trim(),
            data.company?.trim() ?? null,
            data.role?.trim() ?? null,
            data.location?.trim() ?? null,
            data.bio?.trim() ?? null,
            data.linkedinUrl?.trim() ?? null,
            data.githubUrl?.trim() ?? null,
        ]
    );
}

export async function listDirectory(
    options: AlumniDirectoryFilter
): Promise<{ alumni: AlumniProfile[]; total: number }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, Math.min(100, options.limit ?? 12));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ["u.role = 'ALUMNI'"];
    const params: (string | number)[] = [];

    if (options.graduationYear) {
        whereClauses.push("p.graduation_year = ?");
        params.push(options.graduationYear);
    }

    if (options.degree && options.degree.trim() !== "") {
        whereClauses.push("p.degree LIKE ?");
        params.push(`%${options.degree.trim()}%`);
    }

    if (options.company && options.company.trim() !== "") {
        whereClauses.push("p.company LIKE ?");
        params.push(`%${options.company.trim()}%`);
    }

    if (options.search && options.search.trim() !== "") {
        whereClauses.push("(u.name LIKE ? OR p.major LIKE ? OR p.role LIKE ? OR p.company LIKE ?)");
        const searchPattern = `%${options.search.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

    const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT u.id) AS total
         FROM users u
         LEFT JOIN alumni_profiles p ON u.id = p.user_id
         ${whereSql}`,
        params
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await pool.query<AlumniRow[]>(
        `SELECT COALESCE(p.id, 0) AS id, u.id AS userId,
                COALESCE(p.graduation_year, 0) AS graduationYear,
                COALESCE(p.degree, 'Alumni') AS degree,
                COALESCE(p.major, 'N/A') AS major,
                p.company, p.role, p.location, p.bio,
                p.linkedin_url AS linkedinUrl, p.github_url AS githubUrl,
                COALESCE(p.created_at, u.created_at) AS createdAt,
                COALESCE(p.updated_at, u.created_at) AS updatedAt,
                u.name AS userName, u.email AS userEmail
         FROM users u
         LEFT JOIN alumni_profiles p ON u.id = p.user_id
         ${whereSql}
         ORDER BY p.graduation_year DESC, u.name ASC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const alumni: AlumniProfile[] = rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        graduationYear: Number(r.graduationYear),
        degree: r.degree,
        major: r.major,
        company: r.company,
        role: r.role,
        location: r.location,
        bio: r.bio,
        linkedinUrl: r.linkedinUrl,
        githubUrl: r.githubUrl,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userName: r.userName,
        userEmail: r.userEmail,
    }));

    return { alumni, total };
}
