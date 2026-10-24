import type { AuthSessionUser } from "./user.types.js";

declare module "express-session" {
    interface SessionData {
        user?: AuthSessionUser;
        csrfToken?: string;
        flash?: {
            error?: string;
            success?: string;
            info?: string;
        };
        returnTo?: string;
    }
}

declare global {
    namespace Express {
        interface Request {
            apiUser?: AuthSessionUser;
        }
    }
}

export {};
