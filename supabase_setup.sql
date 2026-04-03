-- 1. Create the 'users' table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text,
  email text UNIQUE,
  abha_id text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Our API will tie this table with Supabase Auth (auth.users)
-- If a user signs up with Email, the triggers or the frontend will insert their id into this table.

-- 2. Create the 'patient_profiles' table
CREATE TABLE patient_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  age int,
  gender text,
  food_preference text, -- 'veg' / 'non-veg'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the 'daily_logs' table
CREATE TABLE daily_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  water int DEFAULT 0,
  medicine_taken boolean DEFAULT false,
  sleep_hours int DEFAULT 0,
  symptoms text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
