import type { EventStatus } from "../enums/event.status.js";
import type { RegistrationStatus } from "../enums/registration.status.js";

export interface EventItem {
    id: number;
    title: string;
    description: string;
    location: string;
    eventDate: Date;
    registrationDeadline: Date;
    capacity: number;
    status: EventStatus;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
    confirmedCount?: number | undefined;
    waitlistedCount?: number | undefined;
}

export interface CreateEventInput {
    title: string;
    description: string;
    location: string;
    eventDate: Date;
    registrationDeadline: Date;
    capacity: number;
    createdBy: number;
}

export interface UpdateEventInput {
    title?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    eventDate?: Date | undefined;
    registrationDeadline?: Date | undefined;
    capacity?: number | undefined;
    status?: EventStatus | undefined;
}

export interface EventFilterOptions {
    search?: string | undefined;
    status?: EventStatus | "ALL" | undefined;
    upcomingOnly?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}

export interface EventRegistrationItem {
    id: number;
    eventId: number;
    userId: number;
    status: RegistrationStatus;
    createdAt: Date;
    updatedAt: Date;
    eventTitle?: string | undefined;
    eventDate?: Date | undefined;
    location?: string | undefined;
    userName?: string | undefined;
    userEmail?: string | undefined;
}

export interface RegisterEventResult {
    registrationId: number;
    status: RegistrationStatus;
    message: string;
}
