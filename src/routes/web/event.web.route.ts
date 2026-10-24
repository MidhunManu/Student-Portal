import { Router } from "express";
import {
    handleCancelEventRegistration,
    handleRegisterEvent,
    renderEventDetail,
    renderEventList,
} from "../../controller/web/event.web.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/", renderEventList);
router.get("/:id", renderEventDetail);

router.post("/:id/register", requireAuth, handleRegisterEvent);
router.post("/:id/cancel", requireAuth, handleCancelEventRegistration);

export default router;
