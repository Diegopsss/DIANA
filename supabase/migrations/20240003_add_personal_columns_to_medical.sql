-- Add full_name, age, and birth_date columns to medical_history
ALTER TABLE public.medical_history
  ADD COLUMN IF NOT EXISTS full_name  text,
  ADD COLUMN IF NOT EXISTS age        integer,
  ADD COLUMN IF NOT EXISTS birth_date date;
