import express from "express";
import path from "path";
import { sessionMiddleware } from "./middleware/session.js";
import { csrfProtection } from "./middleware/csrf.js";
import { populateLocals } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

// API routes
import userApiRoutes from "./routes/api/user.api.route.js";
import eventApiRoutes from "./routes/api/event.api.route.js";
import alumniApiRoutes from "./routes/api/alumni.api.route.js";
import jobApiRoutes from "./routes/api/job.api.route.js";
import announcementApiRoutes from "./routes/api/announcement.api.route.js";

// Web routes
import authWebRoutes from "./routes/web/auth.web.route.js";
import studentWebRoutes from "./routes/web/student.web.route.js";
import alumniWebRoutes from "./routes/web/alumni.web.route.js";
import adminWebRoutes from "./routes/web/admin.web.route.js";
import eventWebRoutes from "./routes/web/event.web.route.js";
import announcementWebRoutes from "./routes/web/announcement.web.route.js";
import jobWebRoutes from "./routes/web/job.web.route.js";
import directoryWebRoutes from "./routes/web/directory.web.route.js";

const app = express();

// View Engine setup
app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), "views"));

// Static files
app.use(express.static(path.resolve(process.cwd(), "public")));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session & Security
app.use(sessionMiddleware);
app.use(populateLocals);
app.use(csrfProtection);

// API Routes
app.use("/api/users", userApiRoutes);
app.use("/api/events", eventApiRoutes);
app.use("/api/alumni", alumniApiRoutes);
app.use("/api/jobs", jobApiRoutes);
app.use("/api/announcements", announcementApiRoutes);

// Web Routes
app.use("/student", studentWebRoutes);
app.use("/alumni", alumniWebRoutes);
app.use("/alumni", directoryWebRoutes);
app.use("/directory", directoryWebRoutes);
app.use("/admin", adminWebRoutes);
app.use("/events", eventWebRoutes);
app.use("/announcements", announcementWebRoutes);
app.use("/jobs", jobWebRoutes);
app.use("/", authWebRoutes);

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
