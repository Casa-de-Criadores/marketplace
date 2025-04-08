type ProfileStatus = 'active' | 'pending' | 'inactive';

// public-facing display layer
interface BaseProfile {
    id: string;
    userId: string;
    createdAt: string;
    status: ProfileStatus;
}

interface BrandProfile extends BaseProfile {
    title: string;
    slug: string;
    bio?: string;
    website?: string;
    logoUrl?: string;
}

interface CustomerProfile extends BaseProfile {
    displayName?: string;
    avatarUrl?: string;
    preferences?: Record<string, unknown>;
    language?: string;
}