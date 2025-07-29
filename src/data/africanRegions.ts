import { AfricanRegion, MobileMoneyProvider } from '../types';

export const africanRegions: AfricanRegion[] = [
  {
    id: 'ke',
    country: 'Kenya',
    region: 'East Africa',
    localCurrency: 'KES',
    mobileMoneyProviders: ['M-Pesa', 'Airtel Money'],
    languagePreferences: ['English', 'Swahili'],
    flagEmoji: '🇰🇪'
  },
  {
    id: 'ng',
    country: 'Nigeria',
    region: 'West Africa',
    localCurrency: 'NGN',
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money'],
    languagePreferences: ['English', 'Hausa', 'Yoruba', 'Igbo'],
    flagEmoji: '🇳🇬'
  },
  {
    id: 'gh',
    country: 'Ghana',
    region: 'West Africa',
    localCurrency: 'GHS',
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money'],
    languagePreferences: ['English', 'Twi', 'Ga'],
    flagEmoji: '🇬🇭'
  },
  {
    id: 'za',
    country: 'South Africa',
    region: 'Southern Africa',
    localCurrency: 'ZAR',
    mobileMoneyProviders: ['MTN Mobile Money'],
    languagePreferences: ['English', 'Afrikaans', 'Zulu', 'Xhosa'],
    flagEmoji: '🇿🇦'
  },
  {
    id: 'ug',
    country: 'Uganda',
    region: 'East Africa',
    localCurrency: 'UGX',
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money'],
    languagePreferences: ['English', 'Luganda'],
    flagEmoji: '🇺🇬'
  },
  {
    id: 'tz',
    country: 'Tanzania',
    region: 'East Africa',
    localCurrency: 'TZS',
    mobileMoneyProviders: ['M-Pesa', 'Airtel Money'],
    languagePreferences: ['English', 'Swahili'],
    flagEmoji: '🇹🇿'
  }
];

export const mobileMoneyProviders: MobileMoneyProvider[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    countries: ['KE', 'TZ', 'UG', 'RW'],
    currency: 'Multi',
    icon: '📱',
    color: '#00A651',
    instantConversion: true
  },
  {
    id: 'orange',
    name: 'Orange Money',
    countries: ['SN', 'CI', 'ML', 'BF'],
    currency: 'XOF',
    icon: '🧡',
    color: '#FF6600',
    instantConversion: true
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    countries: ['NG', 'GH', 'UG', 'ZA', 'CM'],
    currency: 'Multi',
    icon: '📲',
    color: '#FFCC00',
    instantConversion: true
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    countries: ['KE', 'UG', 'TZ', 'RW', 'ZM'],
    currency: 'Multi',
    icon: '🔴',
    color: '#E60012',
    instantConversion: true
  }
];