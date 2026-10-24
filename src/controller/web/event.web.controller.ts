import type { Request, Response, NextFunction } from "express";
import * as EventService from "../../service/event.service.js";
import { EventStatus } from "../../enums/event.status.js";

export async function renderEventList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const search = req.query.search as string | undefined;
        const status = req.query.status as any || "ALL";

        const result = await EventService.listEvents({
            search,
            status,
            page,
            limit: 9,
        });

        res.render("events/index", {
            title: "Campus Events - Apex Portal",
            events: result.events,
            total: result.total,
            currentPage: page,
            totalPages: Math.ceil(result.total / 9),
            query: req.query,
            statuses: Object.values(EventStatus),
        });
    } catch (error) {
        next(error);
    }
}

export async function renderEventDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = Number(req.params.id);
        const event = await EventService.getEventById(eventId);
        if (!event) {
            res.status(404);
            return res.render("errors/404", {
                title: "Event Not Found",
                message: "The requested campus event could not be found.",
            });
        }

        let userRegistration = null;
        if (req.session?.user) {
            userRegistration = await EventService.getUserRegistrationForEvent(eventId, req.session.user.id);
        }

        const now = new Date();
        const isClosed = event.status !== EventStatus.UPCOMING || new Date(event.registrationDeadline) < now;
        const isFull = (event.confirmedCount ?? 0) >= event.capacity;

        res.render("events/show", {
            title: `${event.title} - Apex Events`,
            event,
            userRegistration,
            isClosed,
            isFull,
        });
    } catch (error) {
        next(error);
    }
}

export async function handleRegisterEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = Number(req.params.id);
        const userId = req.session.user!.id;

        const result = await EventService.registerForEvent(eventId, userId);
        req.session.flash = { success: result.message };
        res.redirect(`/events/${eventId}`);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "ALREADY_REGISTERED") {
                req.session.flash = { error: "You are already registered for this event." };
                return res.redirect(`/events/${req.params.id}`);
            }
            if (error.message === "REGISTRATION_DEADLINE_PASSED") {
                req.session.flash = { error: "The registration deadline for this event has passed." };
                return res.redirect(`/events/${req.params.id}`);
            }
            if (error.message === "EVENT_NOT_OPEN") {
                req.session.flash = { error: "This event is currently closed for registrations." };
                return res.redirect(`/events/${req.params.id}`);
            }
        }
        next(error);
    }
}

export async function handleCancelEventRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = Number(req.params.id);
        const userId = req.session.user!.id;

        const result = await EventService.cancelRegistration(eventId, userId);
        req.session.flash = { info: result.message };

        const referer = req.header("Referer");
        if (referer && referer.includes("/student/registrations")) {
            return res.redirect("/student/registrations");
        }
        res.redirect(`/events/${eventId}`);
    } catch (error) {
        if (error instanceof Error && error.message === "REGISTRATION_NOT_FOUND") {
            req.session.flash = { error: "Registration not found." };
            return res.redirect(`/events/${req.params.id}`);
        }
        next(error);
    }
}
