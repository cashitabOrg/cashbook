import { supabaseAdmin } from './supabase-admin';
import { getPlanLimits, PlanType } from './plans';

export interface SubscriptionStatus {
  plan: PlanType;
  isTrial: boolean;
  trialDaysLeft: number;
  isExpired: boolean;
  expiryDate: string | null;
  isExempt: boolean;
}

export async function getStoreSubscriptionStatus(storeId: string): Promise<SubscriptionStatus> {
  // 1. Fetch store meta
  const { data: store, error: storeErr } = await supabaseAdmin
    .from('stores')
    .select('created_at, is_billing_exempt, plan')
    .eq('id', storeId)
    .single();

  if (storeErr || !store) {
    return {
      plan: 'free',
      isTrial: false,
      trialDaysLeft: 0,
      isExpired: true,
      expiryDate: null,
      isExempt: false,
    };
  }

  if (store.is_billing_exempt) {
    return {
      plan: 'business',
      isTrial: false,
      trialDaysLeft: 0,
      isExpired: false,
      expiryDate: null,
      isExempt: true,
    };
  }

  // 2. Fetch subscription status from tenant_subscriptions
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('tenant_subscriptions')
    .select('*')
    .eq('store_id', storeId)
    .single();

  const now = new Date();
  const createdAtDate = new Date(store.created_at);
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const trialEndDate = new Date(createdAtDate.getTime() + fourteenDaysMs);
  
  // Calculate trial days left
  const diffTime = trialEndDate.getTime() - now.getTime();
  const trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isInTrial = trialDaysLeft >= 0;

  // If there is an active paid subscription
  if (sub && sub.status === 'active' && sub.current_period_end) {
    const periodEnd = new Date(sub.current_period_end);
    const isExpired = periodEnd.getTime() < now.getTime();
    
    // Check if the plan matches one of our starter, growth, business plans
    let planId = (sub.plan_id || 'starter') as PlanType;
    if (planId === 'free') planId = 'starter'; // fallback if free is set in sub record

    return {
      plan: planId,
      isTrial: false,
      trialDaysLeft: 0,
      isExpired: isExpired,
      expiryDate: sub.current_period_end,
      isExempt: false,
    };
  }

  // If no paid subscription but trial is active
  if (isInTrial) {
    return {
      plan: 'growth', // free trial gives Growth features
      isTrial: true,
      trialDaysLeft: trialDaysLeft,
      isExpired: false,
      expiryDate: trialEndDate.toISOString(),
      isExempt: false,
    };
  }

  // If trial expired and no paid subscription
  return {
    plan: 'free',
    isTrial: false,
    trialDaysLeft: 0,
    isExpired: true,
    expiryDate: null,
    isExempt: false,
  };
}

export async function checkPlanLimit(
  storeId: string,
  action: 'add_staff' | 'add_store',
  ownerEmail?: string
): Promise<{
  allowed: boolean;
  limit: number;
  current: number;
  nextPlan?: PlanType;
  nextPrice?: string;
}> {
  const status = await getStoreSubscriptionStatus(storeId);
  const limits = getPlanLimits(status.plan);

  if (status.isExempt) {
    return { allowed: true, limit: 1000000, current: 0 };
  }

  if (action === 'add_staff') {
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    const currentCount = count || 0;
    const limit = limits.maxStaff;

    if (currentCount >= limit) {
      const nextPlan = status.plan === 'starter' ? 'growth' : 'business';
      const nextPrice = status.plan === 'starter' ? '₦15,000/mo' : '₦35,000/mo';
      return {
        allowed: false,
        limit,
        current: currentCount,
        nextPlan,
        nextPrice,
      };
    }

    return { allowed: true, limit, current: currentCount };
  }

  if (action === 'add_store') {
    if (!ownerEmail) {
      return { allowed: true, limit: 1, current: 1 };
    }

    // Count user accounts with the same email address across stores
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('email', ownerEmail);

    const currentCount = count || 0;
    const limit = limits.maxStores;

    if (currentCount >= limit) {
      const nextPlan = status.plan === 'starter' ? 'growth' : 'business';
      const nextPrice = status.plan === 'starter' ? '₦15,000/mo' : '₦35,000/mo';
      return {
        allowed: false,
        limit,
        current: currentCount,
        nextPlan: status.plan === 'business' ? undefined : nextPlan,
        nextPrice: status.plan === 'business' ? undefined : nextPrice,
      };
    }

    return { allowed: true, limit, current: currentCount };
  }

  return { allowed: true, limit: 0, current: 0 };
}
