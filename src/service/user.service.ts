import bcrypt from "bcryptjs";

import * as UserModel from "../model/user.model.js"
import type { CreateUserInput, UserLoginInput, UserResponse } from "../types/user.types.js";

export async function register(input: CreateUserInput): Promise<UserResponse> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await UserModel.findByEmail(email);

    if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    input.password = passwordHash;
    const userId = await UserModel.create(input);

    return {
        id: userId,
        name: input.name,
        email: email,
        collegeId: input.collegeId,
        role: input.role
    };
}

export async function login(input: UserLoginInput): Promise<UserResponse> {
    const email = input.email.trim().toLowerCase();
    const user = await UserModel.findByEmail(email);

    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = bcrypt.compare(
        input.password,
        user.passwordHash
    );

    if (!isPasswordValid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        collegeId: user.collegeId,
        role: user.role
    };
}
