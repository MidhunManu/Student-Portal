import { Router } from "express";
import {
    renderStudentDashboard,
    renderStudentRegistrations,
} from "../../controller/web/student.web.controller.js";
import { requireRole } from "../../middleware/auth.js";
import { UserRole } from "../../enums/user.role.js";

const router = Router();

router.use(requireRole(UserRole.STUDENT));

router.get("/dashboard", renderStudentDashboard);
router.get("/registrations", renderStudentRegistrations);

export default router;
