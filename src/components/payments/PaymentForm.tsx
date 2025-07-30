import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { CreditCard, Smartphone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { StripePaymentData } from '../../lib/stripe';
import { useCreateStripeCheckout } from '../../hooks/usePayments';

interface PaymentFormProps {
  paymentData: StripePaymentData;
  onSuccess: (sessionId: string) => void;
  onError: (error: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ 
  paymentData, 
  onSuccess, 
  onError 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  
  const createCheckout = useCreateStripeCheckout();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error('Stripe not loaded. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'card') {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        // Create payment method
        const { error: paymentMethodError, paymentMethod: stripePaymentMethod } = 
          await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
              email: paymentData.donorEmail,
              name: paymentData.donorName,
            },
          });

        if (paymentMethodError) {
          throw new Error(paymentMethodError.message);
        }

        // Create checkout session with payment method
        const checkoutData = {
          ...paymentData,
          paymentMethod: 'card' as const,
          stripePaymentMethodId: stripePaymentMethod.id,
        };

        const result = await createCheckout.mutateAsync(checkoutData);
        
        if (result.sessionId) {
          onSuccess(result.sessionId);
        } else if (result.error) {
          throw new Error(result.error);
        }
      } else {
        // Mobile money checkout
        const result = await createCheckout.mutateAsync({
          ...paymentData,
          paymentMethod: 'mobile_money',
        });
        
        if (result.sessionId) {
          onSuccess(result.sessionId);
        } else if (result.error) {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
    hidePostalCode: true,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Complete Your Donation
        </h3>
        <p className="text-gray-600">
          ${paymentData.amount} USD to support this project
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-4 border-2 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              paymentMethod === 'card'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Card</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('mobile_money')}
            className={`p-4 border-2 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              paymentMethod === 'mobile_money'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="font-medium">Mobile Money</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {paymentMethod === 'card' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Details
            </label>
            <div className="p-4 border border-gray-300 rounded-xl">
              <CardElement options={cardElementOptions} />
            </div>
          </div>
        )}

        {paymentMethod === 'mobile_money' && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl">
            <div className="flex items-start space-x-3">
              <Smartphone className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">Mobile Money Payment</p>
                <p>
                  You'll be redirected to complete payment with {paymentData.mobileMoneyProvider}.
                  Your payment will be automatically converted to blockchain donation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Donor Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name (Optional)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="your@email.com"
              defaultValue={paymentData.donorEmail}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              {paymentMethod === 'card' ? (
                <CreditCard className="w-5 h-5" />
              ) : (
                <Smartphone className="w-5 h-5" />
              )}
              <span>Donate ${paymentData.amount}</span>
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Secure & Transparent</p>
              <p>
                Your payment is processed securely by Stripe and automatically converted 
                to blockchain donations. All transactions are publicly verifiable.
              </p>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};