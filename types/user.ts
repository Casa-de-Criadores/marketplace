// identity, authentication, and permissions

type UserRole =  'customer' | 'brand' | 'admin'  | 'super';

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