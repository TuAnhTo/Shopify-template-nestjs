import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';

export interface JWKSKey {
  kty: string;
  kid: string;
  use: string;
  n: string;
  e: string;
  alg: string;
}

export interface JWKSResponse {
  keys: JWKSKey[];
}

@Injectable()
export class JWKSService {
  private readonly logger = new Logger(JWKSService.name);
  private jwksCache: Map<string, JWKSKey[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get JWKS from Shopify for session token validation
   */
  async getShopifyJWKS(shop: string): Promise<JWKSKey[]> {
    const cacheKey = `shopify_${shop}`;

    // Check cache first
    if (this.isValidCache(cacheKey)) {
      return this.jwksCache.get(cacheKey)!;
    }

    try {
      const jwksUrl = `https://${shop}/.well-known/jwks.json`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(jwksUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Shopify-App-Auth-Service',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch JWKS: ${response.status} ${response.statusText}`,
        );
      }

      const jwks = (await response.json()) as JWKSResponse;

      if (!jwks.keys || !Array.isArray(jwks.keys)) {
        throw new Error('Invalid JWKS response format');
      }

      // Cache the keys
      this.jwksCache.set(cacheKey, jwks.keys);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      this.logger.log(`JWKS fetched and cached for shop: ${shop}`);
      return jwks.keys;
    } catch (error) {
      this.logger.error(`Failed to fetch JWKS for shop ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Verify JWT using JWKS
   */
  async verifyJWT(token: string, shop: string): Promise<any> {
    try {
      // Get JWKS keys
      const keys = await this.getShopifyJWKS(shop);

      // Parse the JWT header to get the kid
      const header = jose.decodeProtectedHeader(token);
      const kid = header.kid;

      if (!kid) {
        throw new Error('JWT header missing kid (key ID)');
      }

      // Find the matching key
      const key = keys.find((k) => k.kid === kid);
      if (!key) {
        throw new Error(`No matching key found for kid: ${kid}`);
      }

      // Convert JWK to KeyLike object
      const publicKey = await jose.importJWK({
        kty: key.kty,
        n: key.n,
        e: key.e,
        alg: key.alg,
        use: key.use,
        kid: key.kid,
      });

      // Verify the JWT
      const { payload } = await jose.jwtVerify(token, publicKey, {
        issuer: `https://${shop}`,
        audience: this.configService.get('SHOPIFY_API_KEY'),
      });

      return payload;
    } catch (error) {
      this.logger.error('JWT verification failed:', error);
      throw new Error(
        `JWT verification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Validate session token with proper JWKS verification
   */
  async validateSessionToken(token: string): Promise<any> {
    try {
      // First decode without verification to get the issuer
      const payload = jose.decodeJwt(token);

      if (!payload.iss) {
        throw new Error('JWT missing issuer (iss) claim');
      }

      // Extract shop from issuer
      const issuerUrl = new URL(payload.iss);
      const shop = issuerUrl.hostname;

      // Verify with JWKS
      return await this.verifyJWT(token, shop);
    } catch (error) {
      this.logger.error('Session token validation failed:', error);
      throw error;
    }
  }

  private isValidCache(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Clear JWKS cache for a specific shop
   */
  clearCache(shop: string): void {
    const cacheKey = `shopify_${shop}`;
    this.jwksCache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
    this.logger.log(`JWKS cache cleared for shop: ${shop}`);
  }

  /**
   * Clear all JWKS cache
   */
  clearAllCache(): void {
    this.jwksCache.clear();
    this.cacheExpiry.clear();
    this.logger.log('All JWKS cache cleared');
  }
}
