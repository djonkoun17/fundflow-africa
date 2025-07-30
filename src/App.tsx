import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { StripeProvider } from './components/payments/StripeProvider';
import { Header } from './components/layout/Header';
import { HeroSection } from './components/hero/HeroSection';
import { ImpactDashboard } from './components/impact/ImpactDashboard';
import { MobileMoneyHub } from './components/mobile-money/MobileMoneyHub';
import { ProjectGrid } from './components/projects/ProjectGrid';
import { useOffline } from './hooks/useOffline';
import { useProjects } from './hooks/useProjects';
import { useImpactMetrics } from './hooks/useImpactMetrics';
import { Project, MobileMoneyProvider } from './types';
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { t, i18n } = useTranslation();
  const { isOffline, queuedTransactions } = useOffline();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  
  // Fetch real-time data
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects();
  const { data: impactMetrics, isLoading: metricsLoading, error: metricsError } = useImpactMetrics();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
  };

  const handleViewProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBecomeValidator = () => {
    // Navigate to validator registration
    console.log('Navigate to validator registration');
  };

  const handleProjectSelect = (project: Project) => {
    console.log('Selected project:', project);
    setSelectedProjectId(project.id);
    // Scroll to mobile money section
    document.getElementById('mobile-money')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePaymentMethodSelect = (provider: MobileMoneyProvider) => {
    console.log('Selected payment provider:', provider);
    // Handle payment method selection
  };

  // Show loading state
  if (projectsLoading || metricsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌍</div>
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-lg font-semibold">Loading FundFlow Africa...</div>
          <div className="text-sm text-gray-500">Fetching real-time data...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (projectsError || metricsError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">
            Unable to load data. Please check your connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      {/* Header */}
      <Header 
        onLanguageChange={handleLanguageChange}
        currentLanguage={currentLanguage}
      />

      {/* Hero Section */}
      <HeroSection 
        onViewProjects={handleViewProjects}
        onBecomeValidator={handleBecomeValidator}
      />

      {/* Impact Dashboard */}
      {impactMetrics && <ImpactDashboard metrics={impactMetrics} />}

      {/* Mobile Money Hub */}
      <div id="mobile-money">
        <MobileMoneyHub 
          onPaymentMethodSelect={handlePaymentMethodSelect}
          selectedProjectId={selectedProjectId}
        />
      </div>

      {/* Projects Grid */}
      <div id="projects">
        <ProjectGrid 
          projects={projects}
          onProjectSelect={handleProjectSelect}
        />
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">FundFlow Africa 🌍</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Empowering African communities through transparent, blockchain-secured funding
              with mobile money integration and offline capabilities.
            </p>
            {queuedTransactions.length > 0 && (
              <div className="mt-4 inline-flex items-center bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-sm">
                📱 {queuedTransactions.length} transactions queued for sync
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>How it Works</li>
                <li>For NGOs</li>
                <li>For Donors</li>
                <li>Security</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Validators</li>
                <li>Impact Stories</li>
                <li>Blog</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Compliance</li>
                <li>Transparency</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Connect</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Twitter</li>
                <li>LinkedIn</li>
                <li>Telegram</li>
                <li>Discord</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 FundFlow Africa. Building transparency for African development.</p>
            <p className="mt-2">Smart Contract: 0xFCc30CA595Ec733e1CcA640a3c314e32792DfDF5</p>
            <p className="mt-1 text-xs">
              Status: {isOffline ? '🔴 Offline' : '🟢 Online'} | 
              Projects: {projects.length} | 
              Queued: {queuedTransactions.length}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider>
        <AppContent />
        <ReactQueryDevtools initialIsOpen={false} />
      </StripeProvider>
    </QueryClientProvider>
  );
}

export default App;