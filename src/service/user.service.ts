import bcrypt from "bcryptjs";

import * as UserModel from "../model/user.model.js"
import type { CreateUserInput, UserResponse } from "../types/user.types.js";

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
