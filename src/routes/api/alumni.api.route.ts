import { Router } from "express";
import {
    getMyConnections,
    getMyProfile,
    listDirectory,
    removeConnection,
    respondConnectionRequest,
    sendConnectionRequest,
    updateMyProfile,
} from "../../controller/api/alumni.api.controller.js";
import { requireApiAuth, requireApiRole } from "../../middleware/auth.js";
import { UserRole } from "../../enums/user.role.js";

const router = Router();

router.get("/directory", listDirectory);
router.get("/profile", requireApiAuth, getMyProfile);
router.put("/profile", requireApiAuth, updateMyProfile);

// Connections
router.get("/connections", requireApiAuth, getMyConnections);
router.post("/connections/request", requireApiAuth, requireApiRole(UserRole.ALUMNI), sendConnectionRequest);
router.post("/connections/:id/respond", requireApiAuth, requireApiRole(UserRole.ALUMNI), respondConnectionRequest);
router.delete("/connections/:id", requireApiAuth, removeConnection);

export default router;
