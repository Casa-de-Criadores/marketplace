// product-related
export interface Product {
    // Uses ULID
    id: string;
    brandId: string;
    title: string;
    price: number; // price in BRL
    description: string;
    mainImage: string;
    images: ProductImage[];
    categoryId: string; // Having a single source of truth (ProductCategory) for translations means consistent i18n.
    tagIds: string[]; // "Grunge", "Cyberpunk", "Genderless", "Made in Brazil"
    createdAt: string; // ISO timestamp
    inventory?: number | null; // null = infinite
    isAvailable?: boolean; // to toggle visibility
    updatedAt?: string; // for sorting / change detection
}

export interface ProductCategory {
    id: string; // e.g., "tops", "outerwear"
    name: Record<string, string>; // Localized names
    icon?: string; // Optional icon/image for UI use
    order?: number; // For sorting categories in UI
}

export interface ProductTag {
    id: string; // e.g., "grunge", "genderless"
    name: Record<string, string>; // Localized tag names
    color?: string; // Optional for badges
    description?: Record<string, string>; // If tags need context
}

interface ProductImage {
    url: string;
    alt?: string;
    priority?: number;
}