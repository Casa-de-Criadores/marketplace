// identity, authentication, and permissions

import {UserRole} from "./shared.ts";

export interface User {
    id: string; // ULID or UUID
    login: string;
    email: string;
    passwordHash: string; // tbd hash encryption
    role: UserRole;
    createdAt: string; // ISO timestamp
    lastLoginAt?: string; // for auditing / UX
    isDisabled?: boolean; // soft bans, inactive accounts
}