import type {
    AnnouncementCategory,
    AnnouncementStatus,
} from "../enums/announcement.status.js";

export interface AnnouncementItem {
    id: number;
    title: string;
    content: string;
    category: AnnouncementCategory;
    status: AnnouncementStatus;
    publishedAt: Date | null;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
    authorName?: string | undefined;
}

export interface CreateAnnouncementInput {
    title: string;
    content: string;
    category: AnnouncementCategory;
    status: AnnouncementStatus;
    createdBy: number;
}

export interface UpdateAnnouncementInput {
    title?: string | undefined;
    content?: string | undefined;
    category?: AnnouncementCategory | undefined;
    status?: AnnouncementStatus | undefined;
}

export interface AnnouncementFilterOptions {
    search?: string | undefined;
    category?: AnnouncementCategory | "ALL" | undefined;
    status?: AnnouncementStatus | "ALL" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}
