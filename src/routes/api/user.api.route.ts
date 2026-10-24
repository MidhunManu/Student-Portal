import { Router } from "express";
import {
    getProfile,
    listUsers,
    login,
    logout,
    refreshToken,
    register,
    updateUserRole,
} from "../../controller/api/user.api.controller.js";
import { requireApiAuth, requireApiRole } from "../../middleware/auth.js";
import { authRateLimiter } from "../../middleware/rate-limit.js";
import { UserRole } from "../../enums/user.role.js";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", requireApiAuth, logout);
router.get("/me", requireApiAuth, getProfile);

// Admin user management
router.get("/", requireApiAuth, requireApiRole(UserRole.ADMIN), listUsers);
router.patch("/:id/role", requireApiAuth, requireApiRole(UserRole.ADMIN), updateUserRole);

export default router;
