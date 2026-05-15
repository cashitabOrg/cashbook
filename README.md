# ❄️ FrozenPOS - Technical Documentation & Architecture Deep Dive

This document provides a comprehensive technical overview of the FrozenPOS architecture, file structure, and core logic for developers.

---

## 🏗️ 1. System Architecture

FrozenPOS is built as a **Multi-tenant SaaS** platform using a modern full-stack architecture.

### **Layers:**
- **UI Layer**: Next.js 14+ with Tailwind CSS 4.0. Uses the **App Router** for streaming and server-side rendering.
- **API/Mutation Layer**: Next.js **Server Actions** handle all database mutations, providing a type-safe bridge between UI and DB.
- **Data Persistence**: 
    - **Cloud**: Supabase (PostgreSQL) as the primary source of truth.
    - **Local**: Dexie.js (IndexedDB) for client-side caching and offline queue management.
- **Edge Layer**: Next.js Middleware (`proxy.ts`) manages authentication state, role-based redirects, and route protection.

---

## 🗄️ 2. Database Schema

The database is structured to support strict isolation between stores (tenants).

### **Core Tables:**
- **`stores`**: Primary tenant table. Stores slug, plan, and billing status.
- **`users`**: Combined table for all roles. Linked to `stores` via `store_id`.
- **`products`**: Inventory items. Tracks name, current quantity, and price.
- **`sales_sessions`**: Groups individual sale items into a "session" (Shift or Checkout).
- **`sale_items`**: Individual line items sold.
- **`inventory_movements`**: The **Ledger**. Every single stock change (Sale, Restock, Adjustment) is logged here for audit trails.
- **`tenant_subscriptions`**: Tracks Paystack subscription status and period ends.

### **Logic Automation (Triggers):**
The system relies on **PostgreSQL Triggers** in the `public` schema to ensure atomicity:
- **`trg_master_sale_sync`**: Automatically deducts stock and logs a ledger entry whenever a `sale_item` is inserted, updated, or deleted.
- **`trg_audit_restock_movement`**: Logs restock events to the ledger.
- **`trg_audit_adjustment_movement`**: Logs manual stock adjustments (spoilage/damage).

---

## 📁 3. Directory Structure

### **`/components` - Modular UI Architecture**
The application follows a **feature-first** modular structure to keep files small and maintainable. Large "God Components" are decomposed into:
- **Feature-Specific Folders**: e.g., `/components/admin/dashboard/`, `/components/manager/sales/`.
- **Atomic Sub-components**: Large clients (like `LedgerClient`) are orchestrators that import specialized sub-components (like `LedgerToolbar`, `LedgerTable`) from their local subdirectory.
- **Shared Components**: Common elements (Modals, Icons, Status Badges) reside in `/components/shared/` or the root of `/components/admin` / `/components/manager`.

### **`/app` - Routing & Pages**
- **`/(auth)`**: Auth views (Login/Register).
- **`/[storeSlug]/admin`**: Administrative views.
    - `/dashboard`: High-level analytics.
    - `/products`: Inventory management.
    - `/staff`: Employee management.
    - `/ledger`: Full audit history.
    - `/billing`: Subscription management.
- **`/[storeSlug]/manager`**: Operations views.
    - `/sales`: The Point of Sale (POS) interface.
    - `/history`: Previous checkout logs.
    - `/correction`: Advanced tools for fixing historical data.
- **`/super-admin`**: Platform management (Store deactivation, global audit logs).
- **`/api/webhooks/paystack`**: Endpoint for Paystack payment confirmation.

### **`/actions` - Centralized Server Actions**
- **`auth.ts`**: Handles registration, login, and sign-out logic.
- **`products.ts`**: CRUD for products and manual stock adjustments.
- **`sales.ts`**: Logic for deleting or editing individual sale records.
- **`staff.ts`**: CRUD for manager accounts using the Supabase Auth Admin API.
- **`billing.ts`**: Paystack transaction initialization and subscription status checking.
- **`super-admin.ts`**: Global platform controls.
- **`tenant-data.ts`**: Hard-wipe and Data Export utilities for Super Admins.

### **`/lib` - Core Logic & Utilities**
- **`auth.ts`**: Contains `requireRole()`, the primary security guard for the app.
- **`supabase-server.ts`**: Standard Supabase client (respects RLS).
- **`supabase-admin.ts`**: Service Role client (bypasses RLS).
- **`db.ts`**: Dexie.js database definition for local storage.
- **`plans.ts`**: Hardcoded constants for plan limits (Free, Basic, Pro).
- **`auditlogger.ts`**: Utilities for logging high-level administrative actions.

---

## ⚙️ 4. Key Functions Deep Dive

### **Authorization (`lib/auth.ts`)**
- **`requireRole(allowedRoles[])`**: 
    - Fetches the current user session.
    - Retrieves the user's profile from the database (cached per-request).
    - Validates that the user is active and has one of the allowed roles.
    - **Returns**: User profile + the active `storeId` (including impersonation for super-admins).

### **Offline Synchronization (`lib/db.ts` & `SyncEngine.tsx`)**
- **Dexie Schema**: `products` (local cache) and `offlineQueue` (pending mutations).
- **Sync Logic**: Mutations are first added to the `offlineQueue`. A background engine processes these when online, handling complex dependencies (e.g., creating a session before adding its items).

### **Multi-Tenant Routing (`proxy.ts`)**
- This middleware intercepts every request.
- It detects if a user is trying to access a store slug that doesn't belong to them.
- It enforces "Role-to-Route" mapping (e.g., managers are restricted to `/[slug]/manager/*`).

### **Super Administration (`app/actions/super-admin.ts`, `broadcasts.ts`, `impersonation.ts`)**
- **System Broadcasts**: Global alerts manageable by super-admins that appear across all tenant dashboards.
- **Impersonation**: Allows super-admins to "step into" any store by setting a secure `impersonate_store_id` cookie. This allows them to view exactly what a store admin sees without needing their credentials.
- **Tenant Management**: Hard-wipe and Data Export tools for regulatory compliance or store offboarding.

---

## 🔒 5. Security Architecture

1.  **Row Level Security (RLS)**: Every table has RLS enabled. Policies ensure that a `user` can only see data where `store_id` matches their own.
2.  **Server Actions Guard**: Every exported function in `/actions` begins with a `requireRole()` check.
3.  **Cross-Store Validation**: For actions involving specific resource IDs (like `productId`), the action explicitly verifies that the resource's `store_id` matches the user's `store_id`.
4.  **Sensitive Keys**: The **Service Role Key** is strictly confined to server-side code (`lib/supabase-admin.ts`) and is never sent to the browser.

---

## 🛠️ 6. Maintenance & Scalability

- **Scaling**: The architecture is designed for "infinite" products/staff on the **Pro** plan by bypassing local state limits and relying on direct Supabase queries.
- **Billing**: The `checkActiveSubscription` helper is called in every critical mutation action to block write-access if a plan has expired.
- **Logging**: The `inventory_movements` table provides a "Source of Truth" ledger, making it possible to reconstruct the state of any product at any point in history.
