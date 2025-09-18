import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ShopifyAuthService } from '../services/shopify-auth.service';
import type {
  ShopSessionCheck,
  HealthCheckResponse,
  ServiceInfo,
} from '../types/shopify.types';

@Controller('api/auth/shopify')
export class ShopifyAuthController {
  private readonly logger = new Logger(ShopifyAuthController.name);

  constructor(
    private readonly shopifyAuthService: ShopifyAuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('check-shop/:shop')
  async checkShopSession(
    @Param('shop') shop: string,
  ): Promise<ShopSessionCheck> {
    try {
      const session = await this.shopifyAuthService.getSessionByShop(shop);

      if (!session) {
        return {
          hasValidSession: false,
          shop,
        };
      }

      // Check if session is still valid (not expired)
      const now = new Date();
      const isValid = !session.expiresAt || new Date(session.expiresAt) > now;

      return {
        hasValidSession: isValid && session.isActive,
        shop: session.shop,
        sessionId: session.id,
        hasOnlineToken: !!session.onlineAccessToken,
        hasOfflineToken: !!session.accessToken,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Error checking session for shop ${shop}:`, error);
      return {
        hasValidSession: false,
        shop,
        error: 'Internal error',
      };
    }
  }

  @Post('exchange')
  async exchangeToken(
    @Body() body: { sessionToken: string; tokenType?: 'online' | 'offline' },
  ): Promise<{
    success: boolean;
    access_token?: string;
    scope?: string;
    expires_in?: number;
    token_type?: string;
    error?: string;
    message?: string;
  }> {
    const { sessionToken, tokenType = 'offline' } = body;

    if (!sessionToken) {
      return {
        success: false,
        error: 'Session token required',
      };
    }

    try {
      const result = await this.shopifyAuthService.exchangeSessionToken(
        sessionToken,
        tokenType,
      );

      return {
        success: true,
        access_token: result.access_token,
        scope: result.scope,
        expires_in: result.expires_in,
        token_type: tokenType,
      };
    } catch (error) {
      this.logger.error('Token exchange failed:', error);
      return {
        success: false,
        error: 'Token exchange failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('health')
  health(): HealthCheckResponse {
    try {
      const healthInfo = this.shopifyAuthService.healthCheck();

      return {
        service: 'shopify-auth-internal',
        ...healthInfo,
      };
    } catch (error) {
      this.logger.error('Internal health check failed:', error);
      return {
        service: 'shopify-auth-internal',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('info')
  getServiceInfo(): ServiceInfo {
    const apiKey = this.configService.get<string>('SHOPIFY_API_KEY');
    const hasSecret = !!this.configService.get<string>('SHOPIFY_API_SECRET');

    return {
      service: 'shopify-auth',
      version: '2.0.0',
      flow: 'session-tokens + token-exchange',
      hasApiKey: !!apiKey,
      hasSecret,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'not-set',
      environment: this.configService.get<string>('NODE_ENV') || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
