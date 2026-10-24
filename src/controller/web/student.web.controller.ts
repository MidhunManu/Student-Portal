import type { Request, Response, NextFunction } from "express";
import * as DashboardService from "../../service/dashboard.service.js";
import * as EventService from "../../service/event.service.js";

export async function renderStudentDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const student = req.session.user!;
        const data = await DashboardService.getStudentDashboardData(student.id);

        res.render("student/dashboard", {
            title: "Student Dashboard - Apex Portal",
            student,
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function renderStudentRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const student = req.session.user!;
        const registrations = await EventService.getUserRegistrations(student.id);

        res.render("student/registrations", {
            title: "My Event Registrations - Apex Portal",
            registrations,
        });
    } catch (error) {
        next(error);
    }
}
