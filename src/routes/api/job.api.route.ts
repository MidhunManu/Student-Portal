import { Router } from "express";
import {
    createJob,
    deleteJob,
    getJob,
    listJobs,
    updateJob,
} from "../../controller/api/job.api.controller.js";
import { requireApiAuth, requireApiRole } from "../../middleware/auth.js";
import { UserRole } from "../../enums/user.role.js";

const router = Router();

router.get("/", listJobs);
router.get("/:id", getJob);

router.post("/", requireApiAuth, requireApiRole(UserRole.ALUMNI, UserRole.ADMIN), createJob);
router.put("/:id", requireApiAuth, requireApiRole(UserRole.ALUMNI, UserRole.ADMIN), updateJob);
router.delete("/:id", requireApiAuth, requireApiRole(UserRole.ALUMNI, UserRole.ADMIN), deleteJob);

export default router;
