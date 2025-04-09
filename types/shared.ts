export type UserRole = 'customer' | 'brand' | 'admin' | 'super';
export type ProfileStatus = 'active' | 'pending' | 'inactive';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled' | 'delivered';
export type ShippingStatus = 'pending' | 'in_transit' | 'delivered' | 'failed';
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type InvoiceStatus = 'open' | 'paid' | 'cancelled';
export type PaymentMethodProvider = 'stripe' | 'pix';
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'refunded';

export type ID = string;
export type ISODateString = string;

export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface WithTimestamps {
    createdAt: ISODateString;
    updatedAt?: ISODateString;
}
export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;

export interface Address {
    id: ID;
    userId: ID;
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    isDefault: boolean;
}
