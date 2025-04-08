import {InvoiceStatus, PaymentMethodProvider, TransactionStatus} from "./shared.ts";

export interface PaymentMethod {
    id: string; // reference to Stripe setup ID or similar
    userId: string;
    provider: PaymentMethodProvider;
    label: string; // e.g., "Visa ending in 4242"
    lastUsedAt?: string;
    isDefault: boolean;
    metadata?: Record<string, unknown>; // for stripe/pix token stuff
}

export interface Transaction {
    id: string;
    userId: string;
    orderId: string;
    paymentMethodId?: string;
    amount: number; // in centavos
    status: TransactionStatus;
    createdAt: string;
    confirmedAt?: string;
    provider: PaymentMethodProvider;
    providerTransactionId?: string; // e.g., Stripe or Pix reference
    metadata?: Record<string, unknown>;
}

export interface Invoice {
    id: string;
    orderId: string;
    userId: string;
    issuedAt: string;
    dueAt?: string;
    amount: number;
    status: InvoiceStatus;
    transactionId?: string; // link to payment
    metadata?: Record<string, unknown>;
}

