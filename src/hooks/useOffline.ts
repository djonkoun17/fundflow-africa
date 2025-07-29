import { useState, useEffect } from 'react';
import { DonationTransaction } from '../types';
import { useProcessOfflineTransactions } from './usePayments';
import toast from 'react-hot-toast';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queuedTransactions, setQueuedTransactions] = useState<DonationTransaction[]>([]);
  const processOfflineTransactionsMutation = useProcessOfflineTransactions();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Process queued transactions when back online
      if (queuedTransactions.length > 0) {
        toast.success(`Back online! Processing ${queuedTransactions.length} queued transactions...`);
        processQueuedTransactions();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queuedTransactions]);

  const queueTransaction = (transaction: Omit<DonationTransaction, 'id' | 'timestamp'>) => {
    const newTransaction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...transaction,
      offline: true,
      timestamp: new Date().toISOString()
    } as DonationTransaction;
    
    setQueuedTransactions(prev => [...prev, newTransaction]);
    // Store in localStorage for persistence
    localStorage.setItem('queuedTransactions', JSON.stringify([...queuedTransactions, newTransaction]));
    
    toast.success('Transaction queued for when you\'re back online');
  };

  const processQueuedTransactions = async () => {
    if (queuedTransactions.length === 0) return;

    try {
      // Send all queued transactions to Supabase Edge Function for processing
      await processOfflineTransactionsMutation.mutateAsync(queuedTransactions);
      
      // Clear queue after successful processing
      setQueuedTransactions([]);
      localStorage.removeItem('queuedTransactions');
      
      toast.success(`Successfully synced ${queuedTransactions.length} transactions`);
    } catch (error) {
      console.error('Failed to process queued transactions:', error);
      toast.error('Failed to sync some transactions. They will retry later.');
      
      // Keep failed transactions in queue for retry
      // In a production app, you might want to implement exponential backoff
    }
  };

  // Load queued transactions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('queuedTransactions');
    if (stored) {
      setQueuedTransactions(JSON.parse(stored));
    }
  }, []);

  return {
    isOffline,
    queuedTransactions,
    queueTransaction,
    processQueuedTransactions: () => processQueuedTransactions(),
    isProcessing: processOfflineTransactionsMutation.isPending
  };
};