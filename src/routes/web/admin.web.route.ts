import { Router } from "express";
import {
    handleCancelEvent,
    handleCreateAnnouncement,
    handleCreateEvent,
    handleDeleteAnnouncement,
    handleDeleteJobAdmin,
    handleEditAnnouncement,
    handleEditEvent,
    handleUpdateUserRole,
    renderAdminAnnouncements,
    renderAdminDashboard,
    renderAdminEvents,
    renderAdminJobs,
    renderAdminUsers,
    renderEditAnnouncementForm,
    renderEditEventForm,
    renderNewAnnouncementForm,
    renderNewEventForm,
} from "../../controller/web/admin.web.controller.js";
import { requireRole } from "../../middleware/auth.js";
import { UserRole } from "../../enums/user.role.js";

const router = Router();

router.use(requireRole(UserRole.ADMIN));

router.get("/dashboard", renderAdminDashboard);

// Events management
router.get("/events", renderAdminEvents);
router.get("/events/new", renderNewEventForm);
router.post("/events/new", handleCreateEvent);
router.get("/events/:id/edit", renderEditEventForm);
router.post("/events/:id/edit", handleEditEvent);
router.post("/events/:id/cancel", handleCancelEvent);

// Announcements management
router.get("/announcements", renderAdminAnnouncements);
router.get("/announcements/new", renderNewAnnouncementForm);
router.post("/announcements/new", handleCreateAnnouncement);
router.get("/announcements/:id/edit", renderEditAnnouncementForm);
router.post("/announcements/:id/edit", handleEditAnnouncement);
router.post("/announcements/:id/delete", handleDeleteAnnouncement);

// Job moderation
router.get("/jobs", renderAdminJobs);
router.post("/jobs/:id/delete", handleDeleteJobAdmin);

// User & Role management
router.get("/users", renderAdminUsers);
router.post("/users/:id/role", handleUpdateUserRole);

export default router;
