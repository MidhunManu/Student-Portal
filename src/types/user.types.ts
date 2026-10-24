import type { UserRole } from "../enums/user.role.js"

export interface User {
    id: number
    name: string,
    email: string,
    passwordHash: string,
    role: UserRole,
    collegeId: number,
    createdAt: Date,
    isVerified: boolean,
    refreshToken: string
}

export interface CreateUserInput {
    name: string,
    email: string,
    password: string,
    collegeId: number,
    role: UserRole
}
