import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/**
 * 🔐 Gateway Shopify Auth Service
 *
 * Lightweight auth service for Gateway to handle:
 * - Shop installation checks
 * - Session token validation
 * - Auth URL generation
 * - Session status checks
 */
@Injectable()
export class ShopifyAuthService {
  private readonly logger = new Logger(ShopifyAuthService.name);
  private readonly authServiceUrl: string;
  private readonly shopifyApiKey: string;
  private readonly shopifyApiSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.authServiceUrl =
      this.configService.get('AUTH_HOST') || 'http://localhost:3001';
    this.shopifyApiKey = this.configService.get('SHOPIFY_API_KEY') || '';
    this.shopifyApiSecret = this.configService.get('SHOPIFY_API_SECRET') || '';
  }

  /**
   * 🏪 Check Shop Installation Status
   * Calls auth service to verify if shop is installed
   */
  async checkShopInstallation(shop: string): Promise<boolean> {
    try {
      const sanitizedShop = this.sanitizeShop(shop);

      const response = await fetch(
        `${this.authServiceUrl}/api/auth/session?shop=${sanitizedShop}`,
      );

      if (!response.ok) {
        this.logger.warn(
          `Failed to check shop installation: ${response.status}`,
        );
        return false;
      }

      const data = await response.json();
      return data.hasSession && data.isActive;
    } catch (error) {
      this.logger.error(`Error checking shop installation for ${shop}:`, error);
      return false;
    }
  }

  /**
   * 🔍 Check Active Session Status
   * Verify if shop has an active session
   */
  async checkActiveSession(shop: string): Promise<boolean> {
    try {
      const sanitizedShop = this.sanitizeShop(shop);

      const response = await fetch(
        `${this.authServiceUrl}/api/auth/shopify/check-shop/${sanitizedShop}`,
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.hasValidSession;
    } catch (error) {
      this.logger.error(`Error checking active session for ${shop}:`, error);
      return false;
    }
  }

  /**
   * 🔑 Validate Session Token
   * Validates JWT session token from Shopify
   */
  async validateSessionToken(sessionToken: string): Promise<boolean> {
    try {
      if (!this.shopifyApiSecret) {
        throw new Error('SHOPIFY_API_SECRET not configured');
      }

      // Verify JWT signature
      const payload = this.jwtService.verify(sessionToken, {
        secret: this.shopifyApiSecret,
        algorithms: ['HS256'],
      });

      // Basic validation
      if (
        !payload ||
        !payload.iss ||
        !payload.dest ||
        !payload.aud ||
        !payload.sub
      ) {
        throw new Error('Invalid session token payload');
      }

      // Check audience
      if (payload.aud !== this.shopifyApiKey) {
        throw new Error('Invalid session token audience');
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Session token expired');
      }

      this.logger.log(
        `Valid session token for shop: ${this.extractShopFromPayload(payload)}`,
      );
      return true;
    } catch (error) {
      this.logger.warn(`Session token validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 🔄 Perform Token Exchange
   * Exchange session token for access token via auth service
   */
  async performTokenExchange(sessionToken: string): Promise<boolean> {
    try {
      this.logger.log('Performing token exchange via auth service');

      const response = await fetch(`${this.authServiceUrl}/api/auth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          tokenType: 'offline', // Request offline token for persistent session
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Token exchange failed: ${response.status} ${errorText}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          `Token exchange failed: ${result.error || 'Unknown error'}`,
        );
      }

      this.logger.log('Token exchange completed successfully');
      return true;
    } catch (error) {
      this.logger.error(`Token exchange error: ${error.message}`);
      return false;
    }
  }

  /**
   * 🔗 Generate OAuth URL
   * Creates Shopify OAuth authorization URL
   */
  generateOAuthUrl(shop: string): string {
    const sanitizedShop = this.sanitizeShop(shop);
    const gatewayHost =
      this.configService.get('GATEWAY_HOST') || 'http://localhost:3003';

    const params = new URLSearchParams({
      client_id: this.shopifyApiKey,
      scope: this.configService.get('SCOPES') || 'read_products,write_products',
      redirect_uri: `${gatewayHost}/api/auth/callback`,
      state: this.generateState(),
      'grant_options[]': 'per-user',
    });

    return `https://${sanitizedShop}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * 🔗 Generate Auth URL for Exit iFrame
   * Creates auth URL for embedded app redirect
   */
  generateAuthUrl(shop: string, host?: string): string {
    const gatewayHost =
      this.configService.get('GATEWAY_HOST') || 'http://localhost:3003';

    const params = new URLSearchParams({
      shop: this.sanitizeShop(shop),
    });

    if (host) {
      params.append('host', host);
    }

    return `${gatewayHost}/api/auth?${params.toString()}`;
  }

  /**
   * 🏥 Health Check
   * Check service health and configuration
   */
  healthCheck(): { status: string; config: Record<string, boolean> } {
    return {
      status: 'healthy',
      config: {
        hasApiKey: !!this.shopifyApiKey,
        hasApiSecret: !!this.shopifyApiSecret,
        hasAuthServiceUrl: !!this.authServiceUrl,
      },
    };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Extract shop from JWT payload
   */
  private extractShopFromPayload(payload: any): string {
    if (payload.iss) {
      return payload.iss.replace('https://', '').replace('/admin', '');
    }
    if (payload.dest) {
      return payload.dest.replace('https://', '');
    }
    return '';
  }

  /**
   * Sanitize shop domain
   */
  private sanitizeShop(shop: string): string {
    if (!shop || typeof shop !== 'string') {
      return '';
    }

    const cleanShop = shop.trim().toLowerCase();
    const withoutProtocol = cleanShop.replace(/^https?:\/\//, '');

    // Extract shop name
    const shopMatch = withoutProtocol.match(
      /^([a-z0-9-]+)(?:\.myshopify\.com)?/,
    );

    if (!shopMatch) {
      return '';
    }

    return `${shopMatch[1]}.myshopify.com`;
  }

  /**
   * Generate random state for OAuth
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
