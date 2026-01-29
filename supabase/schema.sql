-- Supabase Schema for T21 Down Syndrome Resources Directory
-- Run this in Supabase SQL Editor to create the tables
-- Project URL: https://qistidaxuevycutiegsa.supabase.co

-- Enable Row Level Security (RLS) for all tables
-- Note: For public read access, we'll create policies that allow anonymous reads

-- ============================================
-- FINANCIAL RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS financial_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id TEXT UNIQUE NOT NULL,
    program_name TEXT NOT NULL,
    organization_type TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    geographic_coverage TEXT,
    states_available TEXT,
    program_category TEXT,
    assistance_type TEXT,
    award_amount_min NUMERIC,
    award_amount_max NUMERIC,
    annual_cap NUMERIC,
    lifetime_cap NUMERIC,
    age_range_min INTEGER DEFAULT 0,
    age_range_max INTEGER DEFAULT 999,
    diagnosis_required TEXT,
    income_limit TEXT,
    income_limit_details TEXT,
    asset_limit TEXT,
    other_eligibility TEXT,
    covered_expenses TEXT,
    application_deadline TEXT,
    application_type TEXT,
    application_url TEXT,
    reapplication_allowed TEXT,
    processing_time TEXT,
    program_description TEXT,
    application_process TEXT,
    key_features TEXT,
    real_world_context TEXT,
    special_notes TEXT,
    last_updated TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- THERAPY SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS therapy_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id TEXT UNIQUE NOT NULL,
    resource_name TEXT NOT NULL,
    organization_name TEXT,
    organization_type TEXT,
    primary_category TEXT DEFAULT 'Healthcare & Therapy',
    subcategories TEXT,
    resource_type TEXT,
    ds_specificity TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    jurisdiction_level TEXT,
    states_available TEXT,
    service_area_notes TEXT,
    lifecycle_stages TEXT,
    age_min INTEGER DEFAULT 0,
    age_max INTEGER DEFAULT 999,
    eligibility_criteria TEXT,
    cost_type TEXT,
    cost_details TEXT,
    application_status TEXT,
    short_description TEXT,
    full_description TEXT,
    key_features TEXT,
    practical_notes TEXT,
    date_added TEXT,
    last_verified TEXT,
    verification_source TEXT,
    data_quality_score INTEGER,
    tags TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INSPIRATION PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inspiration_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    known_as TEXT,
    birth_year INTEGER,
    location_city TEXT,
    location_state TEXT,
    location_country TEXT DEFAULT 'United States',
    primary_field TEXT,
    secondary_fields TEXT,
    specific_achievements TEXT,
    active_status TEXT,
    active_since TEXT,
    website TEXT,
    instagram TEXT,
    tiktok TEXT,
    youtube TEXT,
    facebook TEXT,
    short_bio TEXT,
    notable_quotes TEXT,
    key_accomplishments TEXT,
    speaking_available BOOLEAN DEFAULT FALSE,
    awards_honors TEXT,
    include_in_directory BOOLEAN DEFAULT TRUE,
    directory_categories TEXT,
    featured_profile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE financial_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous read access (public data)
CREATE POLICY "Allow anonymous read access to financial_resources"
    ON financial_resources FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous read access to therapy_services"
    ON therapy_services FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous read access to inspiration_profiles"
    ON inspiration_profiles FOR SELECT
    TO anon
    USING (true);

-- ============================================
-- INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================

-- Financial resources indexes
CREATE INDEX IF NOT EXISTS idx_financial_program_category ON financial_resources(program_category);
CREATE INDEX IF NOT EXISTS idx_financial_geographic_coverage ON financial_resources(geographic_coverage);
CREATE INDEX IF NOT EXISTS idx_financial_organization_type ON financial_resources(organization_type);

-- Therapy services indexes
CREATE INDEX IF NOT EXISTS idx_therapy_primary_category ON therapy_services(primary_category);
CREATE INDEX IF NOT EXISTS idx_therapy_jurisdiction_level ON therapy_services(jurisdiction_level);
CREATE INDEX IF NOT EXISTS idx_therapy_ds_specificity ON therapy_services(ds_specificity);

-- Inspiration profiles indexes
CREATE INDEX IF NOT EXISTS idx_inspiration_primary_field ON inspiration_profiles(primary_field);
CREATE INDEX IF NOT EXISTS idx_inspiration_location_country ON inspiration_profiles(location_country);
CREATE INDEX IF NOT EXISTS idx_inspiration_featured ON inspiration_profiles(featured_profile);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_financial_resources_updated_at
    BEFORE UPDATE ON financial_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapy_services_updated_at
    BEFORE UPDATE ON therapy_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspiration_profiles_updated_at
    BEFORE UPDATE ON inspiration_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
