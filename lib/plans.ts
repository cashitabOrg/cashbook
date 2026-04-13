export type PlanType = 'free' | 'basic' | 'pro';

export interface PlanLimits {
  maxProducts: number;
  maxStaff: number;
  features: {
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
    maxProducts: 20,
    maxStaff: 3,
    features: {
      auditLogs: false,
      advancedAnalytics: false,
      customBranding: false,
    },
    priceMonthly: 0,
    priceAnnual: 0,
    description: 'Perfect for small kiosks and single-user shops.'
  },
  basic: {
    maxProducts: 100,
    maxStaff: 15,
    features: {
      auditLogs: true,
      advancedAnalytics: false,
      customBranding: false,
    },
    priceMonthly: 15000,
    priceAnnual: 150000,
    description: 'Ideal for growing businesses with a small team.'
  },
  pro: {
    maxProducts: 1000000, // Effectively unlimited
    maxStaff: 1000000,
    features: {
      auditLogs: true,
      advancedAnalytics: true,
      customBranding: true,
    },
    priceMonthly: 25000,
    priceAnnual: 250000,
    description: 'Full audit logs, BI intelligence, and unlimited scale.'
  }
};

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  const p = (plan?.toLowerCase() || 'free') as PlanType;
  return PLAN_LIMITS[p] || PLAN_LIMITS.free;
}
