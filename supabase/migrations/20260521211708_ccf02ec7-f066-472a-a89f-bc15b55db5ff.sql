-- Add auto_export toggle
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS auto_export_enabled boolean NOT NULL DEFAULT false;

-- Enable extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;