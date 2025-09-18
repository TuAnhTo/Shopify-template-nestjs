export interface JWTPayload {
  sub: string;
  shop: string;
  aud: string;
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  sid: string;
}

export interface SessionTokenPayload {
  iss: string; // Issuer - shop's admin domain
  dest: string; // Destination - shop's domain
  aud: string; // Audience - client ID
  sub: string; // Subject - user ID
  exp: number; // Expiration time
  nbf: number; // Not before time
  iat: number; // Issued at time
  jti: string; // JWT ID - unique identifier
  sid: string; // Session ID
  sig?: string; // Shopify signature (optional)
}

export interface ShopifySessionToken {
  header: {
    alg: string;
    typ: string;
  };
  payload: SessionTokenPayload;
  signature: string;
}

export interface AuthenticatedUser {
  id: string;
  shop: string;
  email?: string;
  scopes: string[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ShopifyAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  hostUrl: string;
  apiVersion: string;
}
