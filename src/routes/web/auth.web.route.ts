import { Router } from "express";
import {
    handleDashboardRedirect,
    handleLogin,
    handleLogout,
    handleRegister,
    renderLanding,
    renderLogin,
    renderRegister,
} from "../../controller/web/auth.web.controller.js";
import { requireGuest } from "../../middleware/auth.js";
import { authRateLimiter } from "../../middleware/rate-limit.js";

const router = Router();

router.get("/", renderLanding);
router.get("/login", requireGuest, renderLogin);
router.post("/login", requireGuest, authRateLimiter, handleLogin);

router.get("/register", requireGuest, renderRegister);
router.post("/register", requireGuest, authRateLimiter, handleRegister);

router.post("/logout", handleLogout);
router.get("/logout", handleLogout);

router.get("/dashboard", handleDashboardRedirect);

export default router;
