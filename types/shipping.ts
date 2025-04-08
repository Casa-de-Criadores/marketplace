import {ShippingStatus} from "./shared.ts";

type ShippingCarrier = 'correios' | 'custom' | 'manual';

interface ShippingHistoryItem {
    status: ShippingStatus;
    timestamp: string;
    location?: string;
    note?: string;
}

interface Shipping {
    id: string;
    orderId: string;
    carrier?: ShippingCarrier;
    trackingCode?: string;
    estimatedDelivery?: string;
    status: ShippingStatus;
    lastUpdated: string;
    history?: ShippingHistoryItem[];
}