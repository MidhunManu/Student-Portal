import jwt from "jsonwebtoken";
import type { UserRole } from "../enums/user.role.js";

const JWT_SECRET = process.env.JWT_SECRET || "student-portal-dev-jwt-secret-key-32chars";
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface JwtPayload {
    sub: number;
    email: string;
    role: UserRole;
    name: string;
    collegeId: number | null;
}

export function generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
}
