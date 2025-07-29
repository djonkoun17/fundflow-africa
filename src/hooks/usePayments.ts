import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { StripePaymentData, StripeCheckoutResponse } from '../lib/stripe';
import { DonationTransaction } from '../types';
import toast from 'react-hot-toast';

export const useCreateStripeCheckout = () => {
  return useMutation({
    mutationFn: async (paymentData: StripePaymentData): Promise<StripeCheckoutResponse> => {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: paymentData
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        throw new Error(error.message || 'Failed to create payment session');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        // Redirect to Stripe Checkout
        const stripe = window.Stripe;
        if (stripe) {
          stripe.redirectToCheckout({ sessionId: data.sessionId });
        }
      }
    },
    onError: (error) => {
      toast.error(`Payment failed: ${error.message}`);
    }
  });
};

export const useCreateDonationTransaction = () => {
  return useMutation({
    mutationFn: async (transaction: Omit<DonationTransaction, 'id' | 'timestamp'>): Promise<DonationTransaction> => {
      const { data, error } = await supabase
        .from('donation_transactions')
        .insert({
          project_id: transaction.projectId,
          milestone_id: transaction.milestoneId,
          amount: transaction.amount,
          currency: transaction.currency,
          payment_method: transaction.paymentMethod,
          status: transaction.status,
          tx_hash: transaction.txHash,
          donor_address: transaction.donorAddress,
          offline: transaction.offline,
          stripe_payment_intent_id: (transaction as any).stripePaymentIntentId,
          mobile_money_provider: (transaction as any).mobileMoneyProvider
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        projectId: data.project_id,
        milestoneId: data.milestone_id,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.payment_method,
        status: data.status,
        txHash: data.tx_hash,
        donorAddress: data.donor_address,
        timestamp: data.timestamp,
        offline: data.offline
      };
    },
    onSuccess: () => {
      toast.success('Transaction recorded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to record transaction: ${error.message}`);
    }
  });
};

export const useProcessOfflineTransactions = () => {
  return useMutation({
    mutationFn: async (transactions: DonationTransaction[]): Promise<void> => {
      const { error } = await supabase.functions.invoke('process-offline-transactions', {
        body: { transactions }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process offline transactions');
      }
    },
    onSuccess: () => {
      toast.success('Offline transactions synced successfully');
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });
};