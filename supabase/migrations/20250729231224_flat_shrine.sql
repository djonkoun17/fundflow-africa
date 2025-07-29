/*
  # FundFlow Africa Database Schema

  1. New Tables
    - `african_regions` - Store African country and region data
    - `projects` - NGO projects with funding goals and milestones
    - `african_impact_metrics` - Real-time impact tracking across Africa
    - `donation_transactions` - All donation transactions with blockchain integration
    - `community_validators` - Community members who validate project milestones
    - `milestone_validations` - Validation records for project milestones

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and public read access where appropriate
    - Secure donation and validation data

  3. Features
    - Real-time subscriptions for live updates
    - JSON fields for flexible data storage
    - Proper indexing for performance
    - African-specific data structures
*/

-- African Regions Table
CREATE TABLE IF NOT EXISTS african_regions (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  local_currency TEXT NOT NULL,
  mobile_money_providers TEXT[] DEFAULT '{}',
  language_preferences TEXT[] DEFAULT '{}',
  flag_emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  region_id TEXT REFERENCES african_regions(id),
  images TEXT[] DEFAULT '{}',
  ngo_address TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('water', 'education', 'health', 'agriculture', 'infrastructure')),
  milestones JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- African Impact Metrics Table
CREATE TABLE IF NOT EXISTS african_impact_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  water_access_improved INTEGER DEFAULT 0,
  schools_built INTEGER DEFAULT 0,
  health_clinics_supported INTEGER DEFAULT 0,
  jobs_created INTEGER DEFAULT 0,
  communities_reached INTEGER DEFAULT 0,
  local_currency_impact JSONB DEFAULT '{}',
  projects_by_category JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donation Transactions Table
CREATE TABLE IF NOT EXISTS donation_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id TEXT,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mobile_money', 'card', 'crypto')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'queued')),
  tx_hash TEXT,
  donor_address TEXT,
  offline BOOLEAN DEFAULT FALSE,
  stripe_payment_intent_id TEXT,
  mobile_money_provider TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Community Validators Table
CREATE TABLE IF NOT EXISTS community_validators (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  validator_address TEXT UNIQUE NOT NULL,
  region_id TEXT REFERENCES african_regions(id),
  reputation_score INTEGER DEFAULT 100,
  validation_count INTEGER DEFAULT 0,
  community_endorsements INTEGER DEFAULT 0,
  languages TEXT[] DEFAULT '{}',
  avatar TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestone Validations Table
CREATE TABLE IF NOT EXISTS milestone_validations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL,
  validator_id TEXT REFERENCES community_validators(id),
  validation_photos TEXT[] DEFAULT '{}',
  gps_location JSONB,
  feedback_comment TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE african_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE african_impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_validators ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_validations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- African Regions: Public read access
CREATE POLICY "African regions are publicly readable"
  ON african_regions
  FOR SELECT
  TO public
  USING (true);

-- Projects: Public read access, authenticated insert/update
CREATE POLICY "Projects are publicly readable"
  ON projects
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Project owners can update their projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (ngo_address = auth.jwt() ->> 'wallet_address');

-- Impact Metrics: Public read access
CREATE POLICY "Impact metrics are publicly readable"
  ON african_impact_metrics
  FOR SELECT
  TO public
  USING (true);

-- Donation Transactions: Users can read their own transactions
CREATE POLICY "Users can read their own donation transactions"
  ON donation_transactions
  FOR SELECT
  TO authenticated
  USING (donor_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Public can read completed donation transactions"
  ON donation_transactions
  FOR SELECT
  TO public
  USING (status = 'completed');

CREATE POLICY "Authenticated users can insert donation transactions"
  ON donation_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Community Validators: Public read access for active validators
CREATE POLICY "Active validators are publicly readable"
  ON community_validators
  FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Validators can update their own profile"
  ON community_validators
  FOR UPDATE
  TO authenticated
  USING (validator_address = auth.jwt() ->> 'wallet_address');

-- Milestone Validations: Public read access for approved validations
CREATE POLICY "Approved validations are publicly readable"
  ON milestone_validations
  FOR SELECT
  TO public
  USING (status = 'approved');

CREATE POLICY "Validators can insert validations"
  ON milestone_validations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_project ON donation_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_status ON donation_transactions(status);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_timestamp ON donation_transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_validators_region ON community_validators(region_id);
CREATE INDEX IF NOT EXISTS idx_validations_project ON milestone_validations(project_id);

-- Insert Sample African Regions Data
INSERT INTO african_regions (id, country, region, local_currency, mobile_money_providers, language_preferences, flag_emoji) VALUES
  ('ke', 'Kenya', 'East Africa', 'KES', ARRAY['M-Pesa', 'Airtel Money'], ARRAY['English', 'Swahili'], '🇰🇪'),
  ('ng', 'Nigeria', 'West Africa', 'NGN', ARRAY['MTN Mobile Money', 'Airtel Money'], ARRAY['English', 'Hausa', 'Yoruba', 'Igbo'], '🇳🇬'),
  ('gh', 'Ghana', 'West Africa', 'GHS', ARRAY['MTN Mobile Money', 'Airtel Money'], ARRAY['English', 'Twi', 'Ga'], '🇬🇭'),
  ('za', 'South Africa', 'Southern Africa', 'ZAR', ARRAY['MTN Mobile Money'], ARRAY['English', 'Afrikaans', 'Zulu', 'Xhosa'], '🇿🇦'),
  ('ug', 'Uganda', 'East Africa', 'UGX', ARRAY['MTN Mobile Money', 'Airtel Money'], ARRAY['English', 'Luganda'], '🇺🇬'),
  ('tz', 'Tanzania', 'East Africa', 'TZS', ARRAY['M-Pesa', 'Airtel Money'], ARRAY['English', 'Swahili'], '🇹🇿')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Impact Metrics
INSERT INTO african_impact_metrics (
  water_access_improved,
  schools_built,
  health_clinics_supported,
  jobs_created,
  communities_reached,
  local_currency_impact,
  projects_by_category
) VALUES (
  125000,
  450,
  230,
  8500,
  1200,
  '{"KES": 45000000, "NGN": 120000000, "GHS": 25000000, "ZAR": 18000000, "UGX": 180000000}'::JSONB,
  '{"water": 45, "education": 32, "health": 28, "agriculture": 25, "infrastructure": 15}'::JSONB
);

-- Insert Sample Projects
INSERT INTO projects (title, description, target_amount, current_amount, currency, region_id, images, ngo_address, category) VALUES
  (
    'Clean Water Wells for Rural Kenya',
    'Building sustainable water wells in remote villages to provide clean drinking water for 5,000 people across 10 communities in rural Kenya.',
    50000,
    32000,
    'USD',
    'ke',
    ARRAY['https://images.pexels.com/photos/618612/pexels-photo-618612.jpeg'],
    '0x1234567890123456789012345678901234567890',
    'water'
  ),
  (
    'Digital Education Centers in Nigeria',
    'Establishing computer labs and internet connectivity in 15 schools across Lagos and Abuja to bridge the digital divide.',
    75000,
    48000,
    'USD',
    'ng',
    ARRAY['https://images.pexels.com/photos/8613312/pexels-photo-8613312.jpeg'],
    '0x2345678901234567890123456789012345678901',
    'education'
  ),
  (
    'Mobile Health Clinics for Ghana',
    'Deploying mobile medical units to reach underserved communities in northern Ghana, providing healthcare to 10,000+ people.',
    120000,
    85000,
    'USD',
    'gh',
    ARRAY['https://images.pexels.com/photos/4033148/pexels-photo-4033148.jpeg'],
    '0x3456789012345678901234567890123456789012',
    'health'
  );

-- Functions for Real-time Updates
CREATE OR REPLACE FUNCTION update_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_timestamp
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_timestamp();

CREATE OR REPLACE FUNCTION update_impact_metrics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_impact_metrics_timestamp
  BEFORE UPDATE ON african_impact_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_impact_metrics_timestamp();