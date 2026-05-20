# Cashbook Architecture & Team Collaboration Guide

This document outlines the structured separation between the backend and frontend responsibilities in Cashbook, establishing clean boundaries to minimize git conflicts and enable parallel development.

---

## 1. Codebase Structure & Zones

```
cashbook/
├── lib/
│   ├── types/                    ← SHARED: Single source of truth for TypeScript types
│   │   └── index.ts              ← Define new models/schemas here
│   │
│   ├── queries/                  ← BACKEND OWNED: All read queries (Supabase read APIs)
│   │   ├── products.ts           ← getProducts, getProductById
│   │   ├── sales.ts              ← getClosedSessions, getManagerHistory
│   │   ├── staff.ts              ← getStaffPageData
│   │   ├── dashboard.ts          ← getAdminDashboardData, getManagerDashboardData
│   │   └── store.ts              ← getLedgerData, getBillingPageData
│   │
│   ├── auth.ts                   ← BACKEND OWNED: Authorization & Role checks
│   ├── supabase-admin.ts         ← BACKEND OWNED: Supabase admin client (Service Role)
│   ├── supabase-server.ts        ← BACKEND OWNED: Server-side client
│   └── supabase.ts               ← SHARED: Client-side browser Supabase instance
│
├── app/
│   ├── actions/                  ← BACKEND OWNED: Server Actions (Mutations & DB writes)
│   │   ├── products.ts           ← addProduct, updateProduct
│   │   ├── sales.ts              ← startSession, endSession, recordSale
│   │   └── ...
│   │
│   └── [storeSlug]/              ← VIEW/CONTROLLER LAYER: Next.js routes
│       └── .../page.tsx          ← Fetch data from lib/queries/ and pass to components
│
└── components/                   ← FRONTEND OWNED: Modular UI Components
    ├── admin/                    ← Admin dashboards, tables, models
    ├── manager/                  ← Point of Sale (POS) UI, History list
    └── landing/                  ← Marketing site pages and navs
```

---

## 2. Team Ownership & Responsibilities

| Role | Primary Directories | Permitted Actions |
|---|---|---|
| **Backend / DB Owner** | `lib/`, `app/actions/`, Database | Updates types, handles security rules, modifies API schemas, configures RLS/Triggers. |
| **Frontend UI Developer** | `components/`, `hooks/`, styles | Imports types from `lib/types`, calls components, styles layouts, hooks up events. |

---

## 3. Communication Patterns

### A. Fetching Data (Read Queries)
Frontend developers **must never** write raw Supabase calls inside pages or components. 
Instead, call a query function from `lib/queries/`:

**Correct (Server Page):**
```typescript
import { requireRole } from "@/lib/auth";
import { getProducts } from "@/lib/queries/products";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

export default async function Page() {
  const user = await requireRole(["admin"]);
  // Backend provides the function, Frontend consumes it
  const products = await getProducts(user.storeId);

  return <AdminProductsClient products={products} />;
}
```

### B. Mutating Data (Server Actions)
Modifying data (Create, Update, Delete) is handled through **Next.js Server Actions** inside `app/actions/`. 
Backend ensures RLS controls and limits are respected, returning a standardized response:

**Example Action Definition (`app/actions/products.ts`):**
```typescript
"use server";
import { requireRole } from "@/lib/auth";
import { ActionResponse } from "@/lib/types";

export async function addProduct(data: unknown): Promise<ActionResponse> {
  const user = await requireRole(["admin"]);
  // Perform backend validation, database writes
  return { success: true };
}
```

---

## 4. Coding Contracts

1. **Strict Types Policy**: Define all types and shapes inside `lib/types/index.ts`. Never declare entity models inline in components.
2. **Resilience Layer**: All network fetch retries are managed inside `lib/queries` utilizing transient-network retry loops. Do not manually write try-catch fetch logic in page components.
3. **No Direct Admin Client in Browser**: The `supabase-admin.ts` file uses the database service-role key which bypasses all security rules. **Never** import `supabaseAdmin` in browser components (`"use client"`). It should remain inside pages (`page.tsx`) or queries (`lib/queries/`).
