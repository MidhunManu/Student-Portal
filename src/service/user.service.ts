import bcrypt from "bcryptjs";
import * as UserModel from "../model/user.model.js";
import { UserRole } from "../enums/user.role.js";
import type { CreateUserInput, UserLoginInput, UserResponse, User } from "../types/user.types.js";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../config/jwt.js";

export async function register(
    input: CreateUserInput,
    isPublicRegistration = true
): Promise<UserResponse> {
    const email = input.email?.trim().toLowerCase();
    const name = input.name?.trim();
    const password = input.password;

    if (!name || name.length < 2) {
        throw new Error("INVALID_NAME");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("INVALID_EMAIL");
    }

    if (!password || password.length < 8) {
        throw new Error("PASSWORD_TOO_SHORT");
    }

    // Security requirement: Prevent public registration from creating administrator accounts
    if (isPublicRegistration && input.role === UserRole.ADMIN) {
        throw new Error("ADMIN_REGISTRATION_FORBIDDEN");
    }

    if (!Object.values(UserRole).includes(input.role)) {
        throw new Error("INVALID_ROLE");
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await UserModel.create({
        name,
        email,
        password: passwordHash,
        collegeId: input.collegeId ?? null,
        role: input.role,
    });

    return {
        id: userId,
        name,
        email,
        collegeId: input.collegeId ?? null,
        role: input.role,
    };
}

export async function login(input: UserLoginInput): Promise<{
    user: UserResponse;
    accessToken: string;
    refreshToken: string;
}> {
    const email = input.email?.trim().toLowerCase();
    if (!email || !input.password) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const jwtPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        collegeId: user.collegeId,
    };

    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    // Save refresh token for rotation / revocation
    await UserModel.updateRefreshToken(user.id, refreshToken);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            collegeId: user.collegeId,
            role: user.role,
        },
        accessToken,
        refreshToken,
    };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserResponse;
}> {
    try {
        const decoded = verifyToken(refreshToken);
        const user = await UserModel.findById(decoded.sub);

        if (!user || user.refreshToken !== refreshToken) {
            throw new Error("INVALID_REFRESH_TOKEN");
        }

        const newPayload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            collegeId: user.collegeId,
        };

        const newAccessToken = generateAccessToken(newPayload);
        const newRefreshToken = generateRefreshToken(newPayload);

        await UserModel.updateRefreshToken(user.id, newRefreshToken);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                collegeId: user.collegeId,
                role: user.role,
            },
        };
    } catch {
        throw new Error("INVALID_REFRESH_TOKEN");
    }
}

export async function logout(userId: number): Promise<void> {
    await UserModel.updateRefreshToken(userId, null);
}

export async function getUserById(id: number): Promise<UserResponse | null> {
    const user = await UserModel.findById(id);
    if (!user) return null;
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        collegeId: user.collegeId,
        role: user.role,
    };
}

export async function listUsers(options: {
    search?: string | undefined;
    role?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}): Promise<{ users: UserResponse[]; total: number }> {
    const result = await UserModel.listUsers(options);
    return {
        users: result.users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            collegeId: u.collegeId,
            role: u.role,
        })),
        total: result.total,
    };
}

export async function updateUserRole(
    adminUserId: number,
    targetUserId: number,
    newRole: UserRole
): Promise<void> {
    if (adminUserId === targetUserId) {
        throw new Error("CANNOT_MODIFY_OWN_ROLE");
    }
    if (!Object.values(UserRole).includes(newRole)) {
        throw new Error("INVALID_ROLE");
    }
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
        throw new Error("USER_NOT_FOUND");
    }
    await UserModel.updateRole(targetUserId, newRole);
}
