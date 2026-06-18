export type PlanType = 'free' | 'starter' | 'growth' | 'business';

export interface PlanLimits {
  maxProducts: number;
  maxStores: number;
  maxStaff: number;
  maxAdmins: number;
  transactionDays: number; // 90, 180, or -1 (unlimited)
  features: {
    exportReports: boolean;
    multiStoreDashboard: boolean;
    auditLogs: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
  };
  priceMonthly: number;
  priceAnnual: number;
  description: string;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxProducts: 1000000,
    maxStores: 1,
    maxStaff: 2,
    maxAdmins: 1,
    transactionDays: 90,
    features: {
      exportReports: false,
      multiStoreDashboard: false,
      auditLogs: false,
      advancedAnalytics: false,
      customBranding: false,
    },
    priceMonthly: 0,
    priceAnnual: 0,
    description: 'Perfect for small kiosks starting out (14 days free trial includes Growth features).'
  },
  starter: {
    maxProducts: 1000000,
    maxStores: 1,
    maxStaff: 2,
    maxAdmins: 1,
    transactionDays: 90,
    features: {
      exportReports: false,
      multiStoreDashboard: false,
      auditLogs: true,
      advancedAnalytics: false,
      customBranding: false,
    },
    priceMonthly: 7500,
    priceAnnual: 75000,
    description: 'Perfect for single-store setups starting their journey.'
  },
  growth: {
    maxProducts: 1000000,
    maxStores: 1,
    maxStaff: 5,
    maxAdmins: 1,
    transactionDays: 180,
    features: {
      exportReports: true,
      multiStoreDashboard: false,
      auditLogs: true,
      advancedAnalytics: true,
      customBranding: false,
    },
    priceMonthly: 15000,
    priceAnnual: 150000,
    description: 'The standard for growing retail businesses expanding their footprint.'
  },
  business: {
    maxProducts: 1000000,
    maxStores: 3,
    maxStaff: 1000000, // Unlimited
    maxAdmins: 2,
    transactionDays: 1000000, // Unlimited
    features: {
      exportReports: true,
      multiStoreDashboard: true,
      auditLogs: true,
      advancedAnalytics: true,
      customBranding: true,
    },
    priceMonthly: 35000,
    priceAnnual: 350000,
    description: 'Bespoke features and multi-store control for advanced merchants.'
  }
};

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  const p = (plan?.toLowerCase() || 'free') as PlanType;
  // Backward compatibility mappings
  if ((p as string) === 'basic') return PLAN_LIMITS.growth;
  if ((p as string) === 'pro') return PLAN_LIMITS.business;
  if ((p as string) === 'premium') return PLAN_LIMITS.business;
  return PLAN_LIMITS[p] || PLAN_LIMITS.free;
}

export function getPaystackPlanCode(plan: PlanType, cycle: 'monthly' | 'annual'): string | undefined {
  if (plan === 'starter') {
    return cycle === 'monthly'
      ? process.env.NEXT_PUBLIC_PAYSTACK_PLAN_STARTER_MONTHLY
      : process.env.NEXT_PUBLIC_PAYSTACK_PLAN_STARTER_MONTHLY_ANNUAL;
  }
  if (plan === 'growth') {
    return cycle === 'monthly'
      ? process.env.NEXT_PUBLIC_PAYSTACK_PLAN_GROWTH_MONTHLY
      : process.env.NEXT_PUBLIC_PAYSTACK_PLAN_GROWTH_MONTHLY_ANNUAL;
  }
  if (plan === 'business') {
    return cycle === 'monthly'
      ? process.env.NEXT_PUBLIC_PAYSTACK_PLAN_BUSINESS_MONTHLY
      : process.env.NEXT_PUBLIC_PAYSTACK_PLAN_BUSINESS_MONTHLY_ANNUAL;
  }
  return undefined;
}

