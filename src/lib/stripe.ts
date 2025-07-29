import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

export const stripePromise = loadStripe(stripePublishableKey);

export interface StripePaymentData {
  amount: number;
  currency: string;
  projectId: string;
  milestoneId?: string;
  paymentMethod: 'mobile_money' | 'card';
  mobileMoneyProvider?: string;
  donorEmail?: string;
}

export interface StripeCheckoutResponse {
  sessionId?: string;
  clientSecret?: string;
  error?: string;
}