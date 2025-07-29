import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, Globe, Wallet } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

interface HeaderProps {
  onLanguageChange: (lang: string) => void;
  currentLanguage: string;
}

export const Header: React.FC<HeaderProps> = ({ onLanguageChange, currentLanguage }) => {
  const { t } = useTranslation();
  const { isOffline, queuedTransactions } = useOffline();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  return (
    <header className="bg-gradient-to-r from-orange-600 via-red-500 to-yellow-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌍</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FundFlow Africa</h1>
              <p className="text-sm opacity-90">{t('transparency')}</p>
            </div>
          </div>

          {/* Status and Controls */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isOffline ? (
                <div className="flex items-center space-x-1 bg-red-500/20 px-3 py-1 rounded-full">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">Offline</span>
                  {queuedTransactions.length > 0 && (
                    <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full ml-2">
                      {queuedTransactions.length} queued
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-green-500/20 px-3 py-1 rounded-full">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Online</span>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-black">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Connect Wallet Button */}
            <button className="bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">{t('connect_wallet')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};