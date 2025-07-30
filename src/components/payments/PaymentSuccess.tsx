import React, { useEffect } from 'react';
import { CheckCircle, ExternalLink, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface PaymentSuccessProps {
  sessionId: string;
  amount: number;
  projectTitle: string;
  transactionHash?: string;
  onClose: () => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  sessionId,
  amount,
  projectTitle,
  transactionHash,
  onClose
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  useEffect(() => {
    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Donation Successful! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for your ${amount} donation to {projectTitle}
          </p>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Transaction Details</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${amount} USD</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Session ID:</span>
                <div className="flex items-center space-x-1">
                  <span className="font-mono text-xs">{sessionId.slice(0, 20)}...</span>
                  <button
                    onClick={() => copyToClipboard(sessionId)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {transactionHash && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Blockchain TX:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono text-xs">{transactionHash.slice(0, 20)}...</span>
                    <button
                      onClick={() => copyToClipboard(transactionHash)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What Happens Next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your donation is being converted to ETH</li>
              <li>• Funds will be sent to the project's smart contract</li>
              <li>• Community validators will verify milestone progress</li>
              <li>• You'll receive updates on project impact</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Continue
            </button>
            
            {transactionHash && (
              <button
                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank')}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <span>View on Blockchain</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};