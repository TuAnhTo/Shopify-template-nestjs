import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Logger,
  UnauthorizedException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ShopifyAuthService } from '../services/shopify-auth.service';
import type {
  SessionValidationResult,
  TokenExchangeResult,
  SessionInfo,
  LogoutResponse,
  HealthCheckResponse,
} from '../types/shopify.types';

/**
 * 🔐 AuthController - Simple & Clean
 *
 * Handles authentication for Shopify embedded apps using:
 * ✅ Session Token Validation
 * ✅ Token Exchange
 * ✅ Session Management
 */
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: ShopifyAuthService) {}

  /**
   * 🔑 Validate Session Token
   * Frontend sends session token for validation
   */
  @Post('validate')
  validateToken(
    @Headers('authorization') authHeader: string,
  ): SessionValidationResult {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const sessionToken = authHeader.substring(7);

    try {
      const payload = this.authService.validateSessionToken(sessionToken);

      return {
        success: true,
        shop:
          payload.dest?.replace('https://', '') ||
          payload.iss?.replace('https://', '').replace('/admin', ''),
        userId: payload.sub,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
      };
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      throw new UnauthorizedException('Invalid session token');
    }
  }

  /**
   * 🔄 Exchange Token
   * Convert session token to access token
   */
  @Post('exchange')
  async exchangeToken(
    @Headers('authorization') authHeader: string,
    @Body() body: { tokenType?: 'online' | 'offline' } = {},
  ): Promise<TokenExchangeResult> {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const sessionToken = authHeader.substring(7);
    const { tokenType = 'offline' } = body;

    try {
      const result = await this.authService.exchangeSessionToken(
        sessionToken,
        tokenType,
      );

      return {
        success: true,
        access_token: result.access_token,
        scope: result.scope,
        token_type: tokenType,
        expires_in: result.expires_in,
        associated_user: result.associated_user,
      };
    } catch (error) {
      this.logger.error('Token exchange failed:', error);
      throw new UnauthorizedException('Token exchange failed');
    }
  }

  /**
   * 📋 Get Session Info
   * Get session information for a shop
   */
  @Get('session')
  async getSession(@Query('shop') shop: string): Promise<SessionInfo> {
    if (!shop) {
      throw new BadRequestException('Shop parameter required');
    }

    try {
      const session = await this.authService.getSessionByShop(shop);

      if (!session) {
        return {
          hasSession: false,
          shop,
        };
      }

      return {
        hasSession: true,
        shop: session.shop,
        isActive: session.isActive,
        hasOnlineToken: !!session.onlineAccessToken,
        hasOfflineToken: !!session.accessToken,
        scope: session.scope,
        expiresAt: session.expiresAt?.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error('Get session failed:', error);
      return {
        hasSession: false,
        shop,
        error: 'Failed to get session info',
      };
    }
  }

  /**
   * 🗑️ Logout
   * Invalidate sessions for a shop
   */
  @Post('logout')
  async logout(@Body() body: { shop: string }): Promise<LogoutResponse> {
    const { shop } = body;

    if (!shop) {
      throw new BadRequestException('Shop parameter required');
    }

    try {
      await this.authService.invalidateSession(shop);

      return {
        success: true,
        message: `Sessions invalidated for shop: ${shop}`,
      };
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw new UnauthorizedException('Logout failed');
    }
  }

  /**
   * 🏥 Health Check
   */
  @Get('health')
  health(): HealthCheckResponse {
    try {
      const healthInfo = this.authService.healthCheck();

      return {
        service: 'shopify-auth',
        ...healthInfo,
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        service: 'shopify-auth',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
