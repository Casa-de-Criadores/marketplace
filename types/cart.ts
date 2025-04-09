export interface CartItem {
    userId: string;
    productId: string;
    quantity: number;
    addedAt: string; // ISO timestamp
}