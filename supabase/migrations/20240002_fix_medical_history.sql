-- Fix medical_history table: add UNIQUE constraint and missing columns

-- 1. UNIQUE constraint on user_id so upsert works
ALTER TABLE public.medical_history
  ADD CONSTRAINT medical_history_user_id_key UNIQUE (user_id);

-- 2. Missing columns that the form collects but the table doesn't have
ALTER TABLE public.medical_history
  ADD COLUMN IF NOT EXISTS vaginal_infections_detail text,
  ADD COLUMN IF NOT EXISTS surgeries_detail        text,
  ADD COLUMN IF NOT EXISTS pelvic_pain             text,
  ADD COLUMN IF NOT EXISTS abnormal_bleeding       text,
  ADD COLUMN IF NOT EXISTS other_symptoms          text,
  ADD COLUMN IF NOT EXISTS cycle_duration          integer,
  ADD COLUMN IF NOT EXISTS cycle_regularity        text,
  ADD COLUMN IF NOT EXISTS last_pap_smear          date,
  ADD COLUMN IF NOT EXISTS last_ultrasound         date,
  ADD COLUMN IF NOT EXISTS updated_at              timestamp with time zone DEFAULT now();
