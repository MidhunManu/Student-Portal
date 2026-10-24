import { Router } from "express";
import {
    renderAlumniDirectory,
    renderAlumniProfileView,
} from "../../controller/web/directory.web.controller.js";

const router = Router();

router.get("/", renderAlumniDirectory);
router.get("/view/:id", renderAlumniProfileView);

export default router;
