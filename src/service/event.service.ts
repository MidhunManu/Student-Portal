import * as EventModel from "../model/event.model.js";
import * as RegistrationModel from "../model/registration.model.js";
import { EventStatus } from "../enums/event.status.js";
import { RegistrationStatus } from "../enums/registration.status.js";
import type {
    CreateEventInput,
    EventFilterOptions,
    EventItem,
    EventRegistrationItem,
    RegisterEventResult,
    UpdateEventInput,
} from "../types/event.types.js";

export async function createEvent(input: CreateEventInput): Promise<number> {
    if (!input.title || input.title.trim().length === 0) {
        throw new Error("TITLE_REQUIRED");
    }
    if (!input.description || input.description.trim().length === 0) {
        throw new Error("DESCRIPTION_REQUIRED");
    }
    if (!input.location || input.location.trim().length === 0) {
        throw new Error("LOCATION_REQUIRED");
    }
    if (isNaN(input.eventDate.getTime())) {
        throw new Error("INVALID_EVENT_DATE");
    }
    if (isNaN(input.registrationDeadline.getTime())) {
        throw new Error("INVALID_REGISTRATION_DEADLINE");
    }
    if (input.registrationDeadline > input.eventDate) {
        throw new Error("DEADLINE_AFTER_EVENT");
    }
    if (input.capacity <= 0) {
        throw new Error("CAPACITY_MUST_BE_POSITIVE");
    }

    return EventModel.create(input);
}

export async function updateEvent(id: number, input: UpdateEventInput): Promise<void> {
    const existing = await EventModel.findById(id);
    if (!existing) {
        throw new Error("EVENT_NOT_FOUND");
    }

    if (input.capacity !== undefined && input.capacity <= 0) {
        throw new Error("CAPACITY_MUST_BE_POSITIVE");
    }

    if (input.eventDate && input.registrationDeadline) {
        if (input.registrationDeadline > input.eventDate) {
            throw new Error("DEADLINE_AFTER_EVENT");
        }
    }

    await EventModel.update(id, input);
}

export async function cancelEvent(id: number): Promise<void> {
    const existing = await EventModel.findById(id);
    if (!existing) {
        throw new Error("EVENT_NOT_FOUND");
    }

    await EventModel.update(id, { status: EventStatus.CANCELLED });
}

export async function getEventById(id: number): Promise<EventItem | null> {
    return EventModel.findById(id);
}

export async function listEvents(
    options: EventFilterOptions
): Promise<{ events: EventItem[]; total: number }> {
    return EventModel.list(options);
}

export async function registerForEvent(
    eventId: number,
    userId: number
): Promise<RegisterEventResult> {
    const event = await EventModel.findById(eventId);
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }

    if (event.status !== EventStatus.UPCOMING) {
        throw new Error("EVENT_NOT_OPEN");
    }

    const now = new Date();
    if (new Date(event.registrationDeadline) < now) {
        throw new Error("REGISTRATION_DEADLINE_PASSED");
    }

    const result = await RegistrationModel.registerForEvent(eventId, userId);

    const message =
        result.status === RegistrationStatus.CONFIRMED
            ? "Your seat is confirmed! We look forward to seeing you at the event."
            : "The event is currently at full capacity. You have been placed on the waitlist and will be automatically promoted if a seat opens up.";

    return {
        registrationId: result.registrationId,
        status: result.status,
        message,
    };
}

export async function cancelRegistration(
    eventId: number,
    userId: number
): Promise<{ cancelled: boolean; message: string }> {
    const result = await RegistrationModel.cancelRegistration(eventId, userId);
    let message = "Your registration has been cancelled.";
    if (result.promotedUserId) {
        message += " A waitlisted attendee was automatically promoted to confirmed.";
    }
    return { cancelled: true, message };
}

export async function getUserRegistrations(userId: number): Promise<EventRegistrationItem[]> {
    return RegistrationModel.listByUser(userId);
}

export async function getEventRegistrations(eventId: number): Promise<EventRegistrationItem[]> {
    return RegistrationModel.listByEvent(eventId);
}

export async function getUserRegistrationForEvent(
    eventId: number,
    userId: number
): Promise<EventRegistrationItem | null> {
    return RegistrationModel.findByEventAndUser(eventId, userId);
}
