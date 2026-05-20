/**
 * ============================================================
 * CASHBOOK — SHARED TYPE DEFINITIONS
 * ============================================================
 * This file is the single source of truth for all TypeScript
 * types shared between the backend (lib/queries, app/actions)
 * and the frontend (components, hooks).
 *
 * BACKEND TEAM: Define/update types here when DB schema changes.
 * FRONTEND TEAM: Import types from here — never define them inline.
 * ============================================================
 */

// ─── CORE ENTITIES ───────────────────────────────────────────

export type PlanType = 'free' | 'basic' | 'pro';

export interface Store {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  is_active: boolean;
  is_billing_exempt: boolean;
  created_at: string;
}

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager';
  store_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  selling_price: number;
  created_at: string;
}

/** Lightweight product used in dropdowns / pickers */
export interface ProductOption {
  id: string;
  name: string;
}

// ─── SALES ───────────────────────────────────────────────────

export interface SalesSession {
  id: string;
  store_id: string;
  manager_id: string;
  status: 'open' | 'closed';
  approval_status: 'pending' | 'approved';
  total_revenue: number;
  started_at: string;
  ended_at: string | null;
}

export interface SaleItem {
  id: string;
  store_id: string;
  session_id: string;
  product_id: string;
  quantity: number;
  subtotal: number;
  unit_price: number;
  unit_cost: number;
  is_deleted: boolean;
  created_at: string;
}

// ─── DASHBOARD DATA SHAPES ────────────────────────────────────

/** Revenue snapshot — used by both admin and manager dashboards */
export interface RawSession {
  total_revenue: number;
  started_at: string;
}

/** Sale item with product name joined — used for analytics */
export interface RawSaleItem {
  product_id: string;
  quantity: number;
  subtotal: number;
  created_at: string;
  products: { name: string } | null;
}

export interface AdminDashboardData {
  products: Product[];
  rawSessions: RawSession[];
  rawSaleItems: RawSaleItem[];
  recentAdjustments: StockAdjustment[];
  store: Pick<Store, 'plan' | 'is_billing_exempt'> | null;
  staffCount: number;
}

export interface ManagerDashboardData {
  products: Pick<Product, 'id' | 'name' | 'quantity' | 'min_quantity'>[];
  rawSessions: RawSession[];
  rawSaleItems: RawSaleItem[];
}

// ─── STOCK / INVENTORY ────────────────────────────────────────

export interface StockAdjustment {
  id: string;
  store_id: string;
  product_id: string;
  admin_id: string;
  quantity_change: number;
  reason: string;
  note: string | null;
  created_at: string;
  products?: { name: string } | null;
  users?: { full_name: string } | null;
}

export interface InventoryMovement {
  id: string;
  store_id: string;
  product_id: string;
  transaction_type: string;
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  reference_id: string | null;
  note: string | null;
  actor_id: string | null;
  created_at: string;
  products?: { name: string; unit: string } | null;
  users?: { full_name: string } | null;
}

// ─── REPORTS ─────────────────────────────────────────────────

export interface ReportSaleRow {
  id: string;
  timestamp: string;
  dateStr: string;
  managerName: string;
  productName: string;
  qty: number;
  price: number;
  revenue: number;
  cost: number;
  profit: number;
  sessionId: string;
  approvalStatus: 'pending' | 'approved';
  isDeleted: boolean;
}

// ─── HISTORY ─────────────────────────────────────────────────

export interface HistorySessionItem {
  id: string;
  productId: string;
  productName: string;
  qtySold: number;
  revenue: number;
  createdAt: string;
  isDeleted: boolean;
}

export interface HistorySession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalRevenue: number;
  itemsCount: number;
  approvalStatus: 'pending' | 'approved';
  items: HistorySessionItem[];
}

export interface DailyHistoryGroup {
  dateStr: string;
  sessions: HistorySession[];
  dailyTotalRevenue: number;
  dailyTotalItems: number;
  isFullyApproved: boolean;
  productBreakdown: Record<string, {
    productId: string;
    productName: string;
    qtySold: number;
    revenue: number;
  }>;
}

// ─── BILLING ─────────────────────────────────────────────────

export interface TenantSubscription {
  id: string;
  store_id: string;
  plan: PlanType;
  status: 'active' | 'expired' | 'cancelled';
  current_period_start: string;
  current_period_end: string;
  paystack_reference: string | null;
  created_at: string;
}

export interface BillingUsage {
  products: number;
  staff: number;
}

// ─── STAFF ───────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  full_name: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface StaffPageData {
  staffList: StaffMember[];
  store: Pick<Store, 'plan' | 'is_billing_exempt'> | null;
  totalUserCount: number;
}

// ─── API RESPONSE CONVENTION ─────────────────────────────────
/**
 * Standard response shape for all Server Actions.
 * Frontend team should always check for `error` before using `success`.
 */
export interface ActionResponse<T = undefined> {
  success?: boolean;
  error?: string;
  data?: T;
}
