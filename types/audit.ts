export interface AuditLog {
    id: string;
    userId?: string;           // the actor (admin or system)
    action: AdminAction | string; // support custom/system events too
    targetId?: string;         // e.g., productId, userId
    targetType?: string;       // e.g., "Product", "User", "Order"
    timestamp: string;         // ISO
    metadata?: Record<string, unknown>; // anything extra
}

export type AdminAction =
    | 'create_product'
    | 'update_product'
    | 'delete_product'
    | 'approve_brand'
    | 'reject_brand'
    | 'ban_user'
    | 'update_order_status'
    | 'issue_refund'
    | 'generate_invoice'
    | 'manual_payment'
    | 'manual_delivery'
    | 'login_as_user'
    | 'update_permissions';
