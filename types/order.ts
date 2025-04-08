import {OrderStatus, ReturnStatus} from "./shared.ts";

type OrderItem = { productId: string; quantity: number };

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    placedAt: string;
    notes?: string;
    status: OrderStatus;
    shippingAddressId: string;
    paymentMethodId: string;
    couponId?: string;
    discountAmount?: number;
}

interface Coupon {
    id: string;
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    value: number; // e.g., 20 for 20% or R$20
    expiresAt?: string;
    maxUses?: number;
    userLimit?: number;
}

interface ReturnRequest {
    id: string;
    orderId: string;
    userId: string;
    items: OrderItem[];
    reason: string;
    status: ReturnStatus;
    createdAt: string;
    resolvedAt?: string;
}
