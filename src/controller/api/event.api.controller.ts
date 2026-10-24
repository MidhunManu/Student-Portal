import type { Request, Response, NextFunction } from "express";
import * as EventService from "../../service/event.service.js";
import type { EventFilterOptions } from "../../types/event.types.js";

export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const filter: EventFilterOptions = {
            search: req.query.search as string | undefined,
            status: req.query.status as any,
            upcomingOnly: req.query.upcoming === "true",
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        };
        const result = await EventService.listEvents(filter);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        const event = await EventService.getEventById(id);
        if (!event) {
            res.status(404).json({ error: "Event not found" });
            return;
        }

        let userRegistration = null;
        if (req.apiUser) {
            userRegistration = await EventService.getUserRegistrationForEvent(id, req.apiUser.id);
        }

        res.status(200).json({ event, userRegistration });
    } catch (error) {
        next(error);
    }
}

export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = await EventService.createEvent({
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            eventDate: new Date(req.body.eventDate),
            registrationDeadline: new Date(req.body.registrationDeadline),
            capacity: Number(req.body.capacity),
            createdBy: req.apiUser!.id,
        });
        res.status(201).json({ message: "Event created successfully", eventId });
    } catch (error) {
        if (error instanceof Error && ["TITLE_REQUIRED", "LOCATION_REQUIRED", "INVALID_EVENT_DATE", "DEADLINE_AFTER_EVENT", "CAPACITY_MUST_BE_POSITIVE"].includes(error.message)) {
            res.status(400).json({ error: error.message });
            return;
        }
        next(error);
    }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        await EventService.updateEvent(id, {
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
            registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : undefined,
            capacity: req.body.capacity !== undefined ? Number(req.body.capacity) : undefined,
            status: req.body.status,
        });
        res.status(200).json({ message: "Event updated successfully" });
    } catch (error) {
        if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
            res.status(404).json({ error: "Event not found" });
            return;
        }
        next(error);
    }
}

export async function cancelEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);
        await EventService.cancelEvent(id);
        res.status(200).json({ message: "Event cancelled successfully" });
    } catch (error) {
        if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
            res.status(404).json({ error: "Event not found" });
            return;
        }
        next(error);
    }
}

export async function registerForEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = Number(req.params.id);
        const userId = req.apiUser!.id;
        const result = await EventService.registerForEvent(eventId, userId);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "EVENT_NOT_FOUND") {
                res.status(404).json({ error: "Event not found" });
                return;
            }
            if (error.message === "ALREADY_REGISTERED") {
                res.status(409).json({ error: "Already registered for this event" });
                return;
            }
            if (error.message === "REGISTRATION_DEADLINE_PASSED" || error.message === "EVENT_NOT_OPEN") {
                res.status(400).json({ error: error.message });
                return;
            }
        }
        next(error);
    }
}

export async function cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = Number(req.params.id);
        const userId = req.apiUser!.id;
        const result = await EventService.cancelRegistration(eventId, userId);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "REGISTRATION_NOT_FOUND") {
            res.status(404).json({ error: "Registration not found" });
            return;
        }
        next(error);
    }
}

export async function getMyRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.apiUser!.id;
        const registrations = await EventService.getUserRegistrations(userId);
        res.status(200).json({ registrations });
    } catch (error) {
        next(error);
    }
}
