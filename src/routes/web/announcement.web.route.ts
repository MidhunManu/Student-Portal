import { Router } from "express";
import {
    renderAnnouncementDetail,
    renderAnnouncementList,
} from "../../controller/web/announcement.web.controller.js";

const router = Router();

router.get("/", renderAnnouncementList);
router.get("/:id", renderAnnouncementDetail);

export default router;
