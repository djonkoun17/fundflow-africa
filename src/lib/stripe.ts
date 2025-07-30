import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found. Payment features will be disabled.');
}

export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export interface StripePaymentData {
  amount: number;
  currency: string;
  projectId: string;
  milestoneId?: string;
  paymentMethod: 'mobile_money' | 'card';
  mobileMoneyProvider?: string;
  donorEmail?: string;
  donorName?: string;
  donorPhone?: string;
}

export interface StripeCheckoutResponse {
  sessionId?: string;
  clientSecret?: string;
  error?: string;
  paymentIntentId?: string;
}

export interface StripeConfig {
  supportedCountries: string[];
  mobileMoneyProviders: {
    [key: string]: {
      countries: string[];
      currency: string;
      minimumAmount: number;
    };
  };
}

export const stripeConfig: StripeConfig = {
  supportedCountries: ['KE', 'NG', 'GH', 'ZA', 'UG', 'TZ', 'RW', 'SN', 'CI', 'MA'],
  mobileMoneyProviders: {
    'mpesa': {
      countries: ['KE', 'TZ', 'UG', 'RW'],
      currency: 'USD',
      minimumAmount: 1
    },
    'orange_money': {
      countries: ['SN', 'CI', 'ML', 'BF'],
      currency: 'USD',
      minimumAmount: 1
    },
    'mtn_mobile_money': {
      countries: ['NG', 'GH', 'UG', 'ZA', 'CM'],
      currency: 'USD',
      minimumAmount: 1
    },
    'airtel_money': {
      countries: ['KE', 'UG', 'TZ', 'RW', 'ZM'],
      currency: 'USD',
      minimumAmount: 1
    }
  }
};