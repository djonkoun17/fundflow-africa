export interface AfricanRegion {
  id: string;
  country: string;
  region: string;
  localCurrency: string;
  mobileMoneyProviders: string[];
  languagePreferences: string[];
  flagEmoji: string;
}

export interface MobileMoneyProvider {
  id: string;
  name: 'M-Pesa' | 'Orange Money' | 'MTN Mobile Money' | 'Airtel Money';
  countries: string[];
  currency: string;
  icon: string;
  color: string;
  instantConversion: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  region: AfricanRegion;
  milestones: Milestone[];
  images: string[];
  ngoAddress: string;
  createdAt: string;
  category: 'water' | 'education' | 'health' | 'agriculture' | 'infrastructure';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: 'pending' | 'active' | 'completed' | 'verified';
  validationPhotos: string[];
  communityFeedback: CommunityFeedback[];
  validatorsRequired: number;
  validatorsApproved: number;
}

export interface CommunityValidator {
  id: string;
  walletAddress: string;
  region: AfricanRegion;
  reputationScore: number;
  validationCount: number;
  communityEndorsements: number;
  languages: string[];
  avatar: string;
}

export interface CommunityFeedback {
  id: string;
  validatorId: string;
  rating: number;
  comment: string;
  photos: string[];
  gpsLocation?: { lat: number; lng: number };
  timestamp: string;
  language: string;
}

export interface DonationTransaction {
  id: string;
  projectId: string;
  milestoneId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'mobile_money' | 'card' | 'crypto';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'queued';
  txHash?: string;
  donorAddress?: string;
  timestamp: string;
  offline: boolean;
}

export interface AfricanImpactMetrics {
  waterAccessImproved: number;
  schoolsBuilt: number;
  healthClinicsSupported: number;
  jobsCreated: number;
  communitiesReached: number;
  localCurrencyImpact: Record<string, number>;
  projectsByCategory: Record<string, number>;
}