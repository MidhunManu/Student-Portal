import { Router } from "express";
import {
    handleCreateJob,
    handleDeleteJob,
    handleEditJob,
    renderEditJobForm,
    renderJobDetail,
    renderJobList,
    renderMyJobs,
    renderNewJobForm,
} from "../../controller/web/job.web.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { UserRole } from "../../enums/user.role.js";

const router = Router();

router.get("/", renderJobList);
router.get("/new", requireRole(UserRole.ALUMNI, UserRole.ADMIN), renderNewJobForm);
router.post("/new", requireRole(UserRole.ALUMNI, UserRole.ADMIN), handleCreateJob);
router.get("/my", requireRole(UserRole.ALUMNI, UserRole.ADMIN), renderMyJobs);

router.get("/:id", renderJobDetail);
router.get("/:id/edit", requireRole(UserRole.ALUMNI, UserRole.ADMIN), renderEditJobForm);
router.post("/:id/edit", requireRole(UserRole.ALUMNI, UserRole.ADMIN), handleEditJob);
router.post("/:id/delete", requireRole(UserRole.ALUMNI, UserRole.ADMIN), handleDeleteJob);

export default router;
