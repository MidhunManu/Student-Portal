import { Router } from "express";
import {
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncement,
    listAnnouncements,
    updateAnnouncement,
} from "../../controller/api/announcement.api.controller.js";
import { requireApiAuth, requireApiRole } from "../../middleware/auth.js";
import { UserRole } from "../../enums/user.role.js";

const router = Router();

router.get("/", listAnnouncements);
router.get("/:id", getAnnouncement);

// Admin announcement management
router.post("/", requireApiAuth, requireApiRole(UserRole.ADMIN), createAnnouncement);
router.put("/:id", requireApiAuth, requireApiRole(UserRole.ADMIN), updateAnnouncement);
router.delete("/:id", requireApiAuth, requireApiRole(UserRole.ADMIN), deleteAnnouncement);

export default router;
