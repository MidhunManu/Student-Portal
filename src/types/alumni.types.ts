import type { ConnectionStatus } from "../enums/connection.status.js";

export interface AlumniProfile {
    id: number;
    userId: number;
    graduationYear: number;
    degree: string;
    major: string;
    company: string | null;
    role: string | null;
    location: string | null;
    bio: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    userName?: string | undefined;
    userEmail?: string | undefined;
}

export interface UpdateAlumniProfileInput {
    graduationYear: number;
    degree: string;
    major: string;
    company?: string | null | undefined;
    role?: string | null | undefined;
    location?: string | null | undefined;
    bio?: string | null | undefined;
    linkedinUrl?: string | null | undefined;
    githubUrl?: string | null | undefined;
}

export interface AlumniDirectoryFilter {
    search?: string | undefined;
    graduationYear?: number | undefined;
    degree?: string | undefined;
    company?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}

export interface AlumniConnectionItem {
    id: number;
    requesterId: number;
    recipientId: number;
    status: ConnectionStatus;
    createdAt: Date;
    updatedAt: Date;
    otherUserId: number;
    otherUserName: string;
    otherUserEmail: string;
    otherCompany?: string | null | undefined;
    otherRole?: string | null | undefined;
    otherGraduationYear?: number | null | undefined;
    otherDegree?: string | null | undefined;
    isRequester: boolean;
}
