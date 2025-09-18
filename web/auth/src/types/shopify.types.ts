/**
 * 🏷️ Enhanced Shopify Types
 *
 * Complete type definitions for Shopify authentication
 * Updated for latest API version 2025-07
 */

// ==================== TOKEN EXCHANGE TYPES ====================

export interface ShopifyTokenExchangeRequest {
  client_id: string;
  client_secret: string;
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange';
  subject_token: string;
  subject_token_type: 'urn:ietf:params:oauth:token-type:id_token';
  requested_token_type:
    | 'urn:shopify:params:oauth:token-type:online-access-token'
    | 'urn:shopify:params:oauth:token-type:offline-access-token';
}

export interface ShopifyTokenExchangeResponse {
  access_token: string;
  scope: string;
  expires_in?: number; // Only for online tokens
  associated_user_scope?: string; // Only for online tokens
  associated_user?: ShopifyUser; // Only for online tokens
}

export interface ShopifyUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  email_verified: boolean;
  account_owner: boolean;
  locale: string;
  collaborator: boolean;
}

// Alias for backward compatibility
export type ShopifyAssociatedUser = ShopifyUser;

export interface SessionValidationResult {
  success: boolean;
  shop?: string;
  userId?: string;
  expiresAt?: string;
  error?: string;
  message?: string;
}

export interface TokenExchangeResult {
  success: boolean;
  access_token?: string;
  scope?: string;
  expires_in?: number;
  token_type?: 'online' | 'offline';
  associated_user?: ShopifyUser;
  error?: string;
  message?: string;
}

export interface SessionInfo {
  hasSession: boolean;
  shop: string;
  userId?: string;
  isActive?: boolean;
  hasOnlineToken?: boolean;
  hasOfflineToken?: boolean;
  scope?: string[];
  expiresAt?: string;
  updatedAt?: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service?: string;
  version?: string;
  shopifyApiVersion?: string;
  configuration?: Record<string, boolean>;
  dependencies?: Record<string, boolean>;
  error?: string;
}

export interface ShopSessionCheck {
  hasValidSession: boolean;
  shop: string;
  sessionId?: string;
  hasOnlineToken?: boolean;
  hasOfflineToken?: boolean;
  expiresAt?: Date;
  error?: string;
}

export interface ServiceInfo {
  service: string;
  version: string;
  flow: string;
  hasApiKey: boolean;
  hasSecret: boolean;
  apiKeyPreview: string;
  environment: string;
  timestamp: string;
}

export interface PublicConfig {
  shopifyApiKey: string;
  shopifyScopes: string;
  appUrl: string;
  embedded: boolean;
  environment: string;
  authFlow: string;
  version: string;
  timestamp: string;
}

export interface FrontendConfig {
  apiKey: string;
  authFlow: string;
  tokenValidationEndpoint: string;
  tokenExchangeEndpoint: string;
  sessionEndpoint: string;
  embedded: boolean;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  error?: string;
}
