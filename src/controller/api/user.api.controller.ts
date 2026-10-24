import type { Request, Response, NextFunction } from "express";
import * as UserService from "../../service/user.service.js";
import { UserRole } from "../../enums/user.role.js";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await UserService.register(req.body, true);
        res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "EMAIL_ALREADY_EXISTS") {
                res.status(409).json({ error: "Email already registered" });
                return;
            }
            if (error.message === "ADMIN_REGISTRATION_FORBIDDEN") {
                res.status(403).json({ error: "Administrator registration is restricted" });
                return;
            }
            if (["INVALID_NAME", "INVALID_EMAIL", "PASSWORD_TOO_SHORT", "INVALID_ROLE"].includes(error.message)) {
                res.status(400).json({ error: error.message });
                return;
            }
        }
        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await UserService.login(req.body);
        res.status(200).json({
            message: "Login successful",
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        next(error);
    }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const token = req.body.refreshToken;
        if (!token) {
            res.status(400).json({ error: "Refresh token is required" });
            return;
        }

        const result = await UserService.refreshAccessToken(token);
        res.status(200).json({
            message: "Token refreshed successfully",
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
        });
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired refresh token" });
    }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (req.apiUser) {
            await UserService.logout(req.apiUser.id);
        }
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.apiUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const user = await UserService.getUserById(req.apiUser.id);
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const search = req.query.search as string | undefined;
        const role = req.query.role as string | undefined;
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 20;

        const result = await UserService.listUsers({ search, role, page, limit });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const adminId = req.apiUser!.id;
        const targetUserId = Number(req.params.id);
        const newRole = req.body.role as UserRole;

        await UserService.updateUserRole(adminId, targetUserId, newRole);
        res.status(200).json({ message: "User role updated successfully" });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "CANNOT_MODIFY_OWN_ROLE") {
                res.status(400).json({ error: "Cannot modify your own administrator role" });
                return;
            }
            if (error.message === "USER_NOT_FOUND") {
                res.status(404).json({ error: "User not found" });
                return;
            }
        }
        next(error);
    }
}
