
import { type Request, type Response, type NextFunction, response } from "express";
import * as UserService from "../service/user.service.js";

export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const user = await UserService.register(req.body);

        res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "EMAIL_ALREADY_EXISTS"
        ) {
            res.status(409).json({
                error: "Email already registered",
            });
            return;
        }

        next(error);
    }
}

export async function login(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await UserService.login(req.body);
        res.status(200).json({
            message: "login successful",
            user
        });
    } catch(error) {
        if (error instanceof Error && error.message == "INVALID_CREDENTIALS") {
            response.status(401).json({
                message: "wrong credentials"
            });
            return;
        }

        next(error);
    }
}
