-- ==============================================================================
-- जनगणना / जातिगत सर्वेक्षण - परिवार प्रपत्र (Census / Caste Household Schedule)
-- Supabase PostgreSQL Database Schema
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerator Location Settings Table (लोकेशन मास्टर - एक बार सेट करने हेतु)
CREATE TABLE IF NOT EXISTS enumerator_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enumerator_id TEXT NOT NULL,
    enumerator_name TEXT,
    state_name TEXT NOT NULL DEFAULT 'उत्तर प्रदेश',
    district_name TEXT NOT NULL,
    tehsil_block TEXT NOT NULL,
    ward_village_name TEXT NOT NULL,
    village_code TEXT,
    enumeration_block_no TEXT NOT NULL,
    active_section TEXT NOT NULL DEFAULT '1', -- 1, 2, या 3
    sections JSONB DEFAULT '[]'::jsonb,       -- प्रभाग / टोलों की सूची [{id, name}]
    last_building_no TEXT DEFAULT '001',
    last_census_house_no TEXT DEFAULT '001',
    last_household_no TEXT DEFAULT '001',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration safety for existing deployments
ALTER TABLE enumerator_settings ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;

-- 3. Households Table (परिवार प्रपत्र - मुख्य विवरण)
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id TEXT UNIQUE, -- IndexedDB का लोकल ID (डुप्लीकेट रोकने के लिए)
    enumerator_id TEXT NOT NULL,
    
    -- लोकेशन विवरण (Header)
    state_name TEXT NOT NULL,
    district_name TEXT NOT NULL,
    tehsil_block TEXT NOT NULL,
    ward_village_name TEXT NOT NULL,
    enumeration_block_no TEXT NOT NULL,
    village_section TEXT NOT NULL, -- सेक्शन 1, 2, या 3
    
    -- भवन व मकान विवरण (परिवर्तनशील व संपादन योग्य)
    building_no TEXT NOT NULL,       -- भवन संख्या
    census_house_no TEXT NOT NULL,   -- जनगणना मकान सं.
    household_no TEXT NOT NULL,      -- परिवार संख्या (स्वतंत्र संपादन योग्य)
    
    -- परिवार का प्रकार: 1-सामान्य, 2-संस्थागत, 3-बेघर
    household_type INTEGER NOT NULL DEFAULT 1 CHECK (household_type IN (1, 2, 3)),
    
    -- सदस्यों की संख्या
    total_members INTEGER NOT NULL DEFAULT 1,
    head_name TEXT,
    
    -- स्थिति: 'draft' (अपूर्ण) या 'completed' (पूर्ण)
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed')),
    remarks TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Members Table (व्यक्तिगत विवरण - Q.1 से Q.40)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id TEXT UNIQUE, -- IndexedDB का लोकल ID
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    serial_no INTEGER NOT NULL, -- क्रम संख्या (1, 2, 3...)
    
    -- Q.1 से Q.9: बुनियादी जनसांख्यिकी
    q1_name TEXT NOT NULL,                           -- व्यक्ति का नाम
    q2_relationship INTEGER NOT NULL,               -- मुखिया से सम्बन्ध कोड (01-32)
    q3_gender INTEGER NOT NULL CHECK (q3_gender IN (1, 2, 3)), -- 1-पुरुष, 2-महिला, 3-ट्रांसजेंडर
    q4a_dob TEXT,                                   -- जन्म तिथि (DD/MM/YYYY)
    q4b_age INTEGER NOT NULL,                       -- पूर्ण वर्षों में आयु
    q5_marital_status INTEGER NOT NULL CHECK (q5_marital_status IN (1, 2, 3, 4, 5)), -- वैवाहिक स्थिति
    q6_age_at_marriage INTEGER,                     -- विवाह के समय आयु (यदि विवाहित)
    q7_spouse_serial_no TEXT,                       -- पति/पत्नी का परिवार में क्र.सं.
    q8_nationality TEXT DEFAULT 'भारत',             -- घोषित राष्ट्रीयता (भारत या कोड 99)
    q9_religion INTEGER NOT NULL,                   -- धर्म कोड (1-हिन्दू, 2-मुस्लिम, 3-ईसाई, 4-सिख, 5-बौद्ध, 6-जैन, 7-अन्य)
    q9_religion_other TEXT,
    
    -- Q.10 से Q.17: सामाजिक एवं शैक्षणिक विवरण
    q10a_sc_st INTEGER NOT NULL CHECK (q10a_sc_st IN (1, 2, 3)), -- 1-अ.जा., 2-अ.ज.जा., 3-दोनों में नहीं
    q10b_caste_code TEXT,                           -- SC/ST नाम व कोड
    q10c_caste_name TEXT,                           -- जाति का नाम / 'नहीं बताना चाहते' / 'कोई जाति नहीं'
    
    -- Q.11: पिता का विवरण
    q11_father_in_hh BOOLEAN DEFAULT FALSE,
    q11_father_serial_no INTEGER,
    q11_father_name TEXT,
    q11_father_dob TEXT,
    q11_father_birthplace TEXT,
    q11_father_alive BOOLEAN,
    q11_father_religion INTEGER,
    
    -- Q.12: माता का विवरण
    q12_mother_in_hh BOOLEAN DEFAULT FALSE,
    q12_mother_serial_no INTEGER,
    q12_mother_name TEXT,
    q12_mother_dob TEXT,
    q12_mother_birthplace TEXT,
    q12_mother_alive BOOLEAN,
    q12_mother_religion INTEGER,
    
    -- Q.13: दिव्यांगता
    q13a_disabled INTEGER NOT NULL DEFAULT 2 CHECK (q13a_disabled IN (1, 2)), -- 1-हाँ, 2-नहीं
    q13b_disability_types INTEGER[],                -- अधिकतम 3 कोड्स (1 से 9)
    
    -- Q.14: मातृभाषा व अन्य भाषाएँ
    q14a_mother_tongue TEXT NOT NULL DEFAULT 'हिन्दी',
    q14b_other_languages TEXT[],                    -- अधिकतम 2 भाषाएँ
    
    -- Q.15: साक्षरता (7 वर्ष +)
    q15a_literacy INTEGER CHECK (q15a_literacy IN (1, 2)), -- 1-साक्षर, 2-निरक्षर
    q15b_digital_literate INTEGER CHECK (q15b_digital_literate IN (1, 2)), -- 1-हाँ, 2-नहीं
    
    -- Q.16 & Q.17: शिक्षा
    q16_education_status INTEGER,                   -- 1 से 9
    q17a_highest_education INTEGER,                 -- उत्तीर्ण स्तर (00 से 19)
    q17b_subject INTEGER,                           -- विषय कोड (1 से 12)
    
    -- Q.18 से Q.25: आर्थिक एवं कार्य विवरण
    q18_work_last_year INTEGER CHECK (q18_work_last_year IN (1, 2, 3, 4)), -- 1, 2, 3 (कर्मी), 4 (गैर-कर्मी)
    q19_economic_activity INTEGER,                  -- 1-कृषक, 2-मजदूर, 3-घरेलू... 8-अन्य
    q20_occupation TEXT,                            -- व्यवसाय
    q21_industry TEXT,                              -- उद्योग/व्यापार/सेवा
    q22_worker_class INTEGER,                       -- 1-नियोक्ता, 2-कर्मचारी, 3-एकल, 4-पारिवारिक
    q23_non_economic_activity INTEGER,              -- गैर-कर्मी: 1-छात्र, 2-गृह कार्य...
    q24_seeking_work INTEGER,                       -- 1-पूर्णकालिक, 2-अंशकालिक, 3-नहीं
    q25a_travel_distance_km NUMERIC,
    q25b_travel_time_min INTEGER,
    q25c_travel_mode INTEGER,                       -- 0 से 9 कोड
    
    -- Q.26 से Q.30: जन्म व प्रवास
    q26_birth_place_type TEXT DEFAULT 'here',       -- 'here', 'india', 'outside'
    q26_birth_place_details TEXT,
    q27_last_residence_type TEXT DEFAULT 'here',    -- 'here', 'rural', 'urban', 'outside'
    q27_last_residence_details TEXT,
    q28_migration_reason INTEGER,                   -- 1 से 8
    q29_residence_duration_years INTEGER,
    q30_permanent_address_same BOOLEAN DEFAULT TRUE,
    q30_permanent_address TEXT,
    
    -- Q.31 से Q.33: प्रजनन विवरण (केवल विवाहित महिलाओं हेतु)
    q31_children_ever_born_female INTEGER DEFAULT 0,
    q31_children_ever_born_male INTEGER DEFAULT 0,
    q32_children_surviving_female INTEGER DEFAULT 0,
    q32_children_surviving_male INTEGER DEFAULT 0,
    q33_children_born_last_year_female INTEGER DEFAULT 0,
    q33_children_born_last_year_male INTEGER DEFAULT 0,
    
    -- Q.34 से Q.40: कोविड, बैंक व पहचान पत्र
    q34a_covid_vaccinated INTEGER CHECK (q34a_covid_vaccinated IN (1, 2)), -- 1-हाँ, 2-नहीं
    q34b_covid_vaccine_place TEXT,
    q35_bank_accounts_count INTEGER DEFAULT 1,
    q36_mobile_number TEXT,                         -- 10 अंक
    q37_aadhaar_number TEXT,                        -- 12 अंक या 'नहीं'
    q38_voter_id_epic TEXT,                         -- 18 वर्ष +
    q39_passport_number TEXT,
    q40_driving_license INTEGER CHECK (q40_driving_license IN (1, 2)), -- 16 वर्ष + (1-हाँ, 2-नहीं)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for Rapid Searching and Querying
CREATE INDEX IF NOT EXISTS idx_households_location ON households(ward_village_name, village_section, building_no, household_no);
CREATE INDEX IF NOT EXISTS idx_households_status ON households(status);
CREATE INDEX IF NOT EXISTS idx_members_household_id ON members(household_id);
CREATE INDEX IF NOT EXISTS idx_members_caste ON members(q10a_sc_st, q10c_caste_name);
CREATE INDEX IF NOT EXISTS idx_members_age ON members(q4b_age);

-- 6. Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_households_timestamp
BEFORE UPDATE ON households
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_update_members_timestamp
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 7. Row Level Security (RLS) - Open for authenticated / anon with service key
ALTER TABLE enumerator_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write for sync" ON enumerator_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write for households" ON households FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write for members" ON members FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- Schema Complete! Paste this entire script in Supabase SQL Editor and click RUN.
-- ==============================================================================
