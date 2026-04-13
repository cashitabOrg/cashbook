'use server'

import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLAN_LIMITS, PlanType } from "@/lib/plans";
import { redirect } from "next/navigation";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function initializePaystackCheckout(
  storeSlug: string,
  planId: PlanType,
  cycle: 'monthly' | 'annual'
) {
  const userRole = await requireRole(["admin"]);
  
  if (planId === 'free') {
    return { error: 'Cannot checkout a free plan.' };
  }

  const plan = PLAN_LIMITS[planId];
  const amount = cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
  
  // Paystack expects amount in Kobo (NGN * 100)
  const amountInKobo = amount * 100;

  // 1. Get user email (needed by Paystack)
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userRole.userId);
  if (!user?.email) {
    return { error: 'User email not found. Required for payment.' };
  }

  // 2. Initialize Paystack Transaction
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountInKobo,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${storeSlug}/admin/billing/callback`,
      metadata: {
        storeId: userRole.storeId,
        planId,
        cycle,
        userId: userRole.userId,
      },
    }),
  });

  const data = await response.json();

  if (!data.status) {
    console.error('[Billing] Paystack init error:', data.message);
    return { error: data.message || 'Failed to initialize payment.' };
  }

  // Return the authorization_url for client-side redirect or just redirect here
  return { checkoutUrl: data.data.authorization_url };
}

export async function getSubscriptionData(storeId: string) {
  const { data, error } = await supabaseAdmin
    .from('tenant_subscriptions')
    .select('*')
    .eq('store_id', storeId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows found'
    console.error('[Billing] Fetch error:', error.message);
  }

  return data;
}

export async function checkActiveSubscription(storeId: string) {
  // 1. Fetch store exemption status first
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('is_billing_exempt')
    .eq('id', storeId)
    .single();

  if (store?.is_billing_exempt) return { active: true };

  const sub = await getSubscriptionData(storeId);
  
  // If no subscription record, assume 'free' which is always active (handled by limits instead)
  if (!sub) return { active: true };
  if (!sub.current_period_end) return { active: true };

  const isExpired = new Date(sub.current_period_end).getTime() < Date.now();
  
  if (isExpired) {
    return { 
      active: false, 
      error: "Your subscription has expired. Please renew in the Billing section to continue taking actions." 
    };
  }

  return { active: true };
}
