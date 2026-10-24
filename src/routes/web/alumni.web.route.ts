import { Router } from "express";
import {
    handleRemoveConnection,
    handleRespondConnection,
    handleSendConnectionRequest,
    handleUpdateProfile,
    renderAlumniDashboard,
    renderAlumniProfile,
    renderConnections,
} from "../../controller/web/alumni.web.controller.js";
import { requireRole } from "../../middleware/auth.js";
import { UserRole } from "../../enums/user.role.js";

const router = Router();

router.use(requireRole(UserRole.ALUMNI));

router.get("/dashboard", renderAlumniDashboard);
router.get("/profile", renderAlumniProfile);
router.post("/profile", handleUpdateProfile);
router.get("/connections", renderConnections);
router.post("/connections/request", handleSendConnectionRequest);
router.post("/connections/respond", handleRespondConnection);
router.post("/connections/remove", handleRemoveConnection);

export default router;
