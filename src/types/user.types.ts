import type { UserRole } from "../enums/user.role.js";

export interface User {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    collegeId: number | null;
    createdAt: Date;
    isVerified: boolean;
    refreshToken?: string | null | undefined;
}

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    collegeId?: number | null | undefined;
    role: UserRole;
}

export interface UserLoginInput {
    email: string;
    password: string;
}

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    collegeId: number | null;
    role: UserRole;
}

export interface AuthSessionUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    collegeId: number | null;
}
