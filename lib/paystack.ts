/**
 * ============================================================
 * CASHBOOK — PAYSTACK UTILITY (v2 Inline JS)
 * ============================================================
 * Shared loader for Paystack InlineJS v2.
 * - Replaces deprecated v1 PaystackPop.setup() + openIframe()
 * - Uses v2: new PaystackPop() + newTransaction()
 * ============================================================
 */

export interface PaystackTransactionOptions {
  key: string;
  email: string;
  amount?: number;         // in kobo (only when planCode is not set)
  plan?: string;           // Paystack plan code for subscriptions
  metadata?: Record<string, any>;
  onSuccess: (transaction: { reference: string }) => void;
  onCancel: () => void;
}

/**
 * Dynamically loads Paystack InlineJS v2 and resolves when ready.
 */
export const loadPaystack = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if ((window as any).PaystackPop) {
      resolve((window as any).PaystackPop);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => {
      const Pop = (window as any).PaystackPop;
      if (Pop) {
        resolve(Pop);
      } else {
        reject(new Error("PaystackPop not available after script load."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Paystack script."));
    document.body.appendChild(script);
  });
};

/**
 * Opens the Paystack v2 payment modal.
 * Replaces the deprecated PaystackPop.setup() + handler.openIframe() pattern.
 */
export const openPaystack = async (options: PaystackTransactionOptions): Promise<void> => {
  const PaystackPop = await loadPaystack();
  const paystack = new PaystackPop();
  paystack.newTransaction({
    key: options.key,
    email: options.email,
    ...(options.plan ? { plan: options.plan } : { amount: options.amount }),
    metadata: options.metadata || {},
    onSuccess: options.onSuccess,
    onCancel: options.onCancel,
  });
};
