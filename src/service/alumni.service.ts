import * as AlumniModel from "../model/alumni.model.js";
import * as ConnectionModel from "../model/connection.model.js";
import * as UserModel from "../model/user.model.js";
import { UserRole } from "../enums/user.role.js";
import { ConnectionStatus } from "../enums/connection.status.js";
import type {
    AlumniConnectionItem,
    AlumniDirectoryFilter,
    AlumniProfile,
    UpdateAlumniProfileInput,
} from "../types/alumni.types.js";

export async function getProfileByUserId(userId: number): Promise<AlumniProfile | null> {
    return AlumniModel.findByUserId(userId);
}

export async function updateProfile(
    requestingUserId: number,
    targetUserId: number,
    requestingUserRole: UserRole,
    data: UpdateAlumniProfileInput
): Promise<void> {
    // Ownership check: only owner or admin can update profile
    if (requestingUserId !== targetUserId && requestingUserRole !== UserRole.ADMIN) {
        throw new Error("UNAUTHORIZED_PROFILE_MODIFICATION");
    }

    const currentYear = new Date().getFullYear();
    if (data.graduationYear < 1950 || data.graduationYear > currentYear + 10) {
        throw new Error("INVALID_GRADUATION_YEAR");
    }
    if (!data.degree || data.degree.trim().length === 0) {
        throw new Error("DEGREE_REQUIRED");
    }
    if (!data.major || data.major.trim().length === 0) {
        throw new Error("MAJOR_REQUIRED");
    }

    await AlumniModel.upsertProfile(targetUserId, data);
}

export async function listDirectory(
    options: AlumniDirectoryFilter
): Promise<{ alumni: AlumniProfile[]; total: number }> {
    return AlumniModel.listDirectory(options);
}

export async function sendConnectionRequest(
    requesterId: number,
    recipientId: number
): Promise<number> {
    if (requesterId === recipientId) {
        throw new Error("CANNOT_CONNECT_TO_SELF");
    }

    const recipient = await UserModel.findById(recipientId);
    if (!recipient || recipient.role !== UserRole.ALUMNI) {
        throw new Error("RECIPIENT_NOT_FOUND");
    }

    return ConnectionModel.sendRequest(requesterId, recipientId);
}

export async function respondToConnectionRequest(
    userId: number,
    connectionId: number,
    action: "ACCEPT" | "REJECT"
): Promise<void> {
    const connection = await ConnectionModel.findById(connectionId);
    if (!connection) {
        throw new Error("CONNECTION_NOT_FOUND");
    }

    // Only the recipient can accept or reject
    if (connection.recipientId !== userId) {
        throw new Error("UNAUTHORIZED_ACTION");
    }

    if (connection.status !== ConnectionStatus.PENDING) {
        throw new Error("REQUEST_ALREADY_RESOLVED");
    }

    const newStatus = action === "ACCEPT" ? ConnectionStatus.ACCEPTED : ConnectionStatus.REJECTED;
    await ConnectionModel.updateStatus(connectionId, newStatus);
}

export async function removeConnection(
    userId: number,
    connectionId: number,
    userRole: UserRole
): Promise<void> {
    const connection = await ConnectionModel.findById(connectionId);
    if (!connection) {
        throw new Error("CONNECTION_NOT_FOUND");
    }

    // Either party or admin can disconnect
    if (
        connection.requesterId !== userId &&
        connection.recipientId !== userId &&
        userRole !== UserRole.ADMIN
    ) {
        throw new Error("UNAUTHORIZED_ACTION");
    }

    await ConnectionModel.removeConnection(connectionId);
}

export async function getUserConnections(userId: number): Promise<{
    connections: AlumniConnectionItem[];
    pendingReceived: AlumniConnectionItem[];
    pendingSent: AlumniConnectionItem[];
}> {
    return ConnectionModel.listUserConnections(userId);
}
