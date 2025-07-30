import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, CreditCard, Zap, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { mobileMoneyProviders } from '../../data/africanRegions';
import { MobileMoneyProvider } from '../../types';
import { useCreateStripeCheckout } from '../../hooks/usePayments';
import { useOffline } from '../../hooks/useOffline';
import { StripeProvider } from '../payments/StripeProvider';
import { PaymentForm } from '../payments/PaymentForm';
import { PaymentSuccess } from '../payments/PaymentSuccess';
import { stripePromise } from '../../lib/stripe';

interface MobileMoneyHubProps {
  onPaymentMethodSelect: (provider: MobileMoneyProvider) => void;
  selectedProjectId?: string;
}

export const MobileMoneyHub: React.FC<MobileMoneyHubProps> = ({ 
  onPaymentMethodSelect, 
  selectedProjectId 
}) => {
  const { t } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>('10');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    sessionId: string;
    amount: number;
    projectTitle: string;
    transactionHash?: string;
  } | null>(null);
  
  const createStripeCheckout = useCreateStripeCheckout();
  const { isOffline, queueTransaction } = useOffline();

  const handleProviderSelect = (provider: MobileMoneyProvider) => {
    setSelectedProvider(provider);
    onPaymentMethodSelect(provider);
  };

  const handlePayment = async () => {
    if (!selectedProvider || !donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error('Please select a payment method and enter a valid amount');
      return;
    }

    if (!selectedProjectId) {
      toast.error('No project selected for donation');
      return;
    }

    if (isOffline) {
      // Queue transaction for offline processing
      queueTransaction({
        projectId: selectedProjectId,
        amount: parseFloat(donationAmount),
        currency: 'USD',
        paymentMethod: 'mobile_money',
        status: 'queued',
        offline: true
      });
      
      toast.success('Payment queued - will process when back online');
      setDonationAmount('10');
      setDonorEmail('');
      setDonorName('');
    } else {
      // Show payment form for online processing
      setShowPaymentForm(true);
    }
  };

  const handlePaymentSuccess = (sessionId: string) => {
    setPaymentSuccess({
      sessionId,
      amount: parseFloat(donationAmount),
      projectTitle: 'Selected Project', // You can get this from project data
    });
    setShowPaymentForm(false);
    setDonationAmount('10');
    setDonorEmail('');
    setDonorName('');
    setSelectedProvider(null);
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setShowPaymentForm(false);
  };

  const paymentData = {
    amount: parseFloat(donationAmount),
    currency: 'USD',
    projectId: selectedProjectId || '',
    paymentMethod: 'mobile_money' as const,
    mobileMoneyProvider: selectedProvider?.name,
    donorEmail: donorEmail || undefined,
    donorName: donorName || undefined,
  };
  return (
    <StripeProvider>
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('mobile_money')} 📱
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Donate using your mobile money account. Instantly converted to blockchain donations.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Mobile Money Providers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {mobileMoneyProviders.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                  selectedProvider?.id === provider.id ? 'scale-105' : ''
                }`}
                onClick={() => handleProviderSelect(provider)}
              >
                <div className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 transition-all duration-300 ${
                  selectedProvider?.id === provider.id 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  {/* Provider Icon */}
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl"
                    style={{ backgroundColor: `${provider.color}20`, color: provider.color }}
                  >
                    {provider.icon}
                  </div>

                  {/* Provider Info */}
                  <h3 className="font-bold text-gray-900 text-center mb-2">
                    {provider.name}
                  </h3>
                  
                  <div className="text-sm text-gray-600 text-center mb-3">
                    {provider.countries.length} countries
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center text-xs text-gray-500">
                      <Zap className="w-3 h-3 mr-1" />
                      Instant Conversion
                    </div>
                    <div className="flex items-center justify-center text-xs text-gray-500">
                      <Shield className="w-3 h-3 mr-1" />
                      Secure & Encrypted
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedProvider?.id === provider.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Donation Form */}
          {selectedProvider && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Donate via {selectedProvider.name}
                </h3>
                <p className="text-gray-600">
                  Your donation will be instantly converted to ETH and sent to the blockchain
                </p>
              </div>

              <div className="max-w-md mx-auto">
                {/* Email Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Donation Amount (USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-semibold text-center"
                      placeholder="0.00"
                      min="1"
                    />
                    <div className="absolute right-3 top-3 text-gray-500">
                      USD
                    </div>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {['5', '10', '25', '50'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDonationAmount(amount)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        donationAmount === amount
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                {/* Payment Button */}
                <button 
                  onClick={handlePayment}
                  disabled={!selectedProvider || !donationAmount || parseFloat(donationAmount) <= 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>
                    {isOffline 
                        ? `Queue Payment via ${selectedProvider.name}`
                        : `Pay with ${selectedProvider.name}`
                    }
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Offline Notice */}
                {isOffline && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Smartphone className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-medium mb-1">Offline Mode</p>
                        <p>Your payment will be queued and processed automatically when you're back online.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Secure & Transparent</p>
                      <p>Your payment is processed securely through Stripe and automatically converted to blockchain donations. All transactions are publicly verifiable on the blockchain.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && stripePromise && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full">
              <PaymentForm
                paymentData={paymentData}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
              <button
                onClick={() => setShowPaymentForm(false)}
                className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Payment Success Modal */}
        {paymentSuccess && (
          <PaymentSuccess
            sessionId={paymentSuccess.sessionId}
            amount={paymentSuccess.amount}
            projectTitle={paymentSuccess.projectTitle}
            transactionHash={paymentSuccess.transactionHash}
            onClose={() => setPaymentSuccess(null)}
          />
        )}
      </div>
      </section>
    </StripeProvider>
  );
};