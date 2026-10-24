import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        if (req.accepts("html") && !req.path.startsWith("/api")) {
            if (req.session) {
                req.session.flash = { error: "Too many authentication attempts. Please wait a few minutes." };
            }
            return res.redirect(req.path);
        }
        res.status(429).json({
            error: "Too many requests. Please try again later.",
        });
    },
});
