import { Router } from "express";
import {
    cancelEvent,
    cancelRegistration,
    createEvent,
    getEvent,
    getMyRegistrations,
    listEvents,
    registerForEvent,
    updateEvent,
} from "../../controller/api/event.api.controller.js";
import { requireApiAuth, requireApiRole } from "../../middleware/auth.js";
import { UserRole } from "../../enums/user.role.js";

const router = Router();

router.get("/", listEvents);
router.get("/registrations/my", requireApiAuth, getMyRegistrations);
router.get("/:id", getEvent);

// Admin event management
router.post("/", requireApiAuth, requireApiRole(UserRole.ADMIN), createEvent);
router.put("/:id", requireApiAuth, requireApiRole(UserRole.ADMIN), updateEvent);
router.post("/:id/cancel-event", requireApiAuth, requireApiRole(UserRole.ADMIN), cancelEvent);

// Registration actions
router.post("/:id/register", requireApiAuth, registerForEvent);
router.post("/:id/cancel", requireApiAuth, cancelRegistration);

export default router;
