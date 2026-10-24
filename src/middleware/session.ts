import session from "express-session";

const isProduction = process.env.NODE_ENV === "production";

export const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "portal-super-secret-session-key-change-in-prod-32chars",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
});
