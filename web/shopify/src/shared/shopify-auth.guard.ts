import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';

export interface ShopifySessionInfo {
  shop: string;
  userId: string;
  sessionId: string;
  sessionToken?: string;
}

export interface ShopifyRequest extends Request {
  shopifySession?: ShopifySessionInfo;
  shop?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Shopify Auth Guard for microservices
 *
 * This guard assumes that session token validation has already been done
 * by the API Gateway. It extracts and validates the session information
 * passed through headers by the gateway.
 */
@Injectable()
export class ShopifyAuthGuard implements CanActivate {
  private readonly logger = new Logger(ShopifyAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ShopifyRequest>();

    try {
      // Extract session information from headers set by API Gateway
      const sessionInfo = this.extractSessionInfo(request);

      if (!sessionInfo) {
        throw new UnauthorizedException(
          'Shopify session information not found',
        );
      }

      // Validate session information
      this.validateSessionInfo(sessionInfo);

      // Attach session info to request for controllers to use
      request.shopifySession = sessionInfo;
      request.shop = sessionInfo.shop;
      request.userId = sessionInfo.userId;
      request.sessionId = sessionInfo.sessionId;

      this.logger.debug(
        `Shopify session validated - Shop: ${sessionInfo.shop}, User: ${sessionInfo.userId}`,
      );

      return true;
    } catch (error) {
      this.logger.error('Shopify auth guard failed:', error);
      throw new UnauthorizedException(
        error instanceof Error
          ? error.message
          : 'Shopify authentication failed',
      );
    }
  }

  private extractSessionInfo(
    request: ShopifyRequest,
  ): ShopifySessionInfo | null {
    // Extract session information from headers set by API Gateway
    const shop = request.headers['x-shopify-shop-domain'] as string;
    const userId = request.headers['x-shopify-user-id'] as string;
    const sessionId = request.headers['x-shopify-session-id'] as string;
    const sessionToken = request.headers['x-shopify-session-token'] as string;

    if (!shop || !userId || !sessionId) {
      return null;
    }

    return {
      shop,
      userId,
      sessionId,
      sessionToken,
    };
  }

  private validateSessionInfo(sessionInfo: ShopifySessionInfo): void {
    // Validate shop domain format
    if (!this.isValidShopDomain(sessionInfo.shop)) {
      throw new UnauthorizedException('Invalid shop domain');
    }

    // Validate user ID format (should be a numeric string for Shopify users)
    if (!sessionInfo.userId || !/^\d+$/.test(sessionInfo.userId)) {
      throw new UnauthorizedException('Invalid user ID');
    }

    // Validate session ID format (should be a UUID)
    if (!sessionInfo.sessionId || !this.isValidUUID(sessionInfo.sessionId)) {
      throw new UnauthorizedException('Invalid session ID');
    }
  }

  private isValidShopDomain(shop: string): boolean {
    // Validate shop domain format - should be a Shopify domain
    const shopRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]*\.(myshopify\.com|shopify\.com|shopifycloud\.com)$/;
    return shopRegex.test(shop);
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
