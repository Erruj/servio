ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;