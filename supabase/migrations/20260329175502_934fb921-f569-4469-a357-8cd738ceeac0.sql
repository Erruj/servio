
ALTER TABLE email_connections 
  ALTER COLUMN access_token DROP NOT NULL,
  ALTER COLUMN refresh_token DROP NOT NULL,
  ALTER COLUMN token_expires_at DROP NOT NULL;

ALTER TABLE email_connections
  ADD COLUMN IF NOT EXISTS imap_host text,
  ADD COLUMN IF NOT EXISTS imap_port integer DEFAULT 993,
  ADD COLUMN IF NOT EXISTS smtp_host text,
  ADD COLUMN IF NOT EXISTS smtp_port integer DEFAULT 587,
  ADD COLUMN IF NOT EXISTS use_ssl boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS encrypted_password text;
