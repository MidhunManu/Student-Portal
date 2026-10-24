import * as AnnouncementModel from "../model/announcement.model.js";
import { AnnouncementCategory, AnnouncementStatus } from "../enums/announcement.status.js";
import type {
    AnnouncementFilterOptions,
    AnnouncementItem,
    CreateAnnouncementInput,
    UpdateAnnouncementInput,
} from "../types/announcement.types.js";

export async function createAnnouncement(
    input: CreateAnnouncementInput
): Promise<number> {
    if (!input.title || input.title.trim().length === 0) {
        throw new Error("TITLE_REQUIRED");
    }
    if (!input.content || input.content.trim().length === 0) {
        throw new Error("CONTENT_REQUIRED");
    }
    if (!Object.values(AnnouncementCategory).includes(input.category)) {
        throw new Error("INVALID_CATEGORY");
    }
    if (!Object.values(AnnouncementStatus).includes(input.status)) {
        throw new Error("INVALID_STATUS");
    }

    return AnnouncementModel.create(input);
}

export async function getAnnouncementById(id: number): Promise<AnnouncementItem | null> {
    return AnnouncementModel.findById(id);
}

export async function updateAnnouncement(
    id: number,
    data: UpdateAnnouncementInput
): Promise<void> {
    const existing = await AnnouncementModel.findById(id);
    if (!existing) {
        throw new Error("ANNOUNCEMENT_NOT_FOUND");
    }

    if (data.category && !Object.values(AnnouncementCategory).includes(data.category)) {
        throw new Error("INVALID_CATEGORY");
    }
    if (data.status && !Object.values(AnnouncementStatus).includes(data.status)) {
        throw new Error("INVALID_STATUS");
    }

    await AnnouncementModel.update(id, data);
}

export async function deleteAnnouncement(id: number): Promise<void> {
    const existing = await AnnouncementModel.findById(id);
    if (!existing) {
        throw new Error("ANNOUNCEMENT_NOT_FOUND");
    }
    await AnnouncementModel.deleteAnnouncement(id);
}

export async function listAnnouncements(
    options: AnnouncementFilterOptions
): Promise<{ announcements: AnnouncementItem[]; total: number }> {
    return AnnouncementModel.list(options);
}
