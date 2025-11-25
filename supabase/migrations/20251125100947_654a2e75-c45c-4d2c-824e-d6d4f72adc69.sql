-- Add subscription tracking fields to user_settings table
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_product_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone DEFAULT (now() + interval '14 days'),
ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamp with time zone;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_customer ON user_settings(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_subscription_status ON user_settings(subscription_status);

-- Add comment for documentation
COMMENT ON COLUMN user_settings.subscription_status IS 'Subscription status: trial, active, canceled, expired, incomplete';
COMMENT ON COLUMN user_settings.trial_end_date IS '14-day free trial period - locks paid features after expiry';