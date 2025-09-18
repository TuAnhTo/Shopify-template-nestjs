-- Migration: Create shopify_sessions table
-- Date: 2025-01-16
-- Description: Table để lưu Shopify session data với session tokens và access tokens

CREATE TABLE IF NOT EXISTS shopify_sessions (
  id VARCHAR(255) PRIMARY KEY,                    -- Session ID từ JWT (sid claim)
  shop VARCHAR(255) NOT NULL,                     -- Shop domain (e.g., myshop.myshopify.com)
  user_id VARCHAR(255) NOT NULL,                  -- User ID từ session token (sub claim)
  access_token TEXT NOT NULL,                     -- Offline access token từ token exchange
  online_access_token TEXT,                       -- Online access token (nếu có)
  scope TEXT[] NOT NULL DEFAULT '{}',             -- Access scopes được grant
  expires_at TIMESTAMP WITH TIME ZONE,            -- Expiry time cho online tokens
  user_info JSONB,                                -- User information từ associated_user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,                 -- Session có active không

-- Indexes
CONSTRAINT unique_shop_user UNIQUE (shop, user_id) );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopify_sessions_shop ON shopify_sessions (shop);

CREATE INDEX IF NOT EXISTS idx_shopify_sessions_user_id ON shopify_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_shopify_sessions_active ON shopify_sessions (is_active);

CREATE INDEX IF NOT EXISTS idx_shopify_sessions_expires_at ON shopify_sessions (expires_at)
WHERE
    expires_at IS NOT NULL;

-- Trigger để auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shopify_sessions_updated_at 
  BEFORE UPDATE ON shopify_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON
TABLE shopify_sessions IS 'Bảng lưu trữ Shopify session data với session tokens và access tokens';

COMMENT ON COLUMN shopify_sessions.id IS 'Session ID từ JWT session token (sid claim)';

COMMENT ON COLUMN shopify_sessions.shop IS 'Shop domain từ session token (dest claim)';

COMMENT ON COLUMN shopify_sessions.user_id IS 'User ID từ session token (sub claim)';

COMMENT ON COLUMN shopify_sessions.access_token IS 'Offline access token từ token exchange - không expire';

COMMENT ON COLUMN shopify_sessions.online_access_token IS 'Online access token - expire sau 24h';

COMMENT ON COLUMN shopify_sessions.scope IS 'Array các access scopes được grant cho app';

COMMENT ON COLUMN shopify_sessions.expires_at IS 'Expiry time cho online access tokens';

COMMENT ON COLUMN shopify_sessions.user_info IS 'User information từ associated_user trong token response';

COMMENT ON COLUMN shopify_sessions.is_active IS 'Session có active không - dùng để soft delete';