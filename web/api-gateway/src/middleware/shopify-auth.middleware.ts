import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface ShopifyRequest extends Request {
  shopifySession?: any;
  shop?: string;
  userId?: string;
  sessionId?: string;
  originalSessionToken?: string;
}

@Injectable()
export class ShopifyAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ShopifyAuthMiddleware.name);

  use(req: ShopifyRequest, res: Response, next: NextFunction) {
    // Extract Shopify-specific headers and session info
    const shopifyHeaders = this.extractShopifyHeaders(req);

    // Attach to request for proxy service to use
    req['shopifyHeaders'] = shopifyHeaders;

    this.logger.debug(
      `Shopify auth middleware - Shop: ${shopifyHeaders['x-shopify-shop-domain']}, User: ${shopifyHeaders['x-shopify-user-id']}`,
    );

    next();
  }

  private extractShopifyHeaders(req: ShopifyRequest): Record<string, string> {
    const headers: Record<string, string> = {};

    // Extract Authorization header (session token)
    if (req.headers.authorization) {
      headers['authorization'] = req.headers.authorization;
    }

    // Extract session token from custom header if present
    if (req.headers['x-shopify-session-token']) {
      headers['x-shopify-session-token'] = req.headers[
        'x-shopify-session-token'
      ] as string;
    }

    // Extract shop domain (set by AuthGuard if session is valid)
    if (req.headers['x-shopify-shop-domain']) {
      headers['x-shopify-shop-domain'] = req.headers[
        'x-shopify-shop-domain'
      ] as string;
    } else if (req.shop) {
      headers['x-shopify-shop-domain'] = req.shop;
    } else if (req.query.shop) {
      headers['x-shopify-shop-domain'] = req.query.shop as string;
    }

    // Extract user ID (set by AuthGuard if session is valid)
    if (req.headers['x-shopify-user-id']) {
      headers['x-shopify-user-id'] = req.headers['x-shopify-user-id'] as string;
    } else if (req.userId) {
      headers['x-shopify-user-id'] = req.userId;
    }

    // Extract session ID (set by AuthGuard if session is valid)
    if (req.headers['x-shopify-session-id']) {
      headers['x-shopify-session-id'] = req.headers[
        'x-shopify-session-id'
      ] as string;
    } else if (req.sessionId) {
      headers['x-shopify-session-id'] = req.sessionId;
    }

    // Extract HMAC for webhook verification
    if (req.headers['x-shopify-hmac-sha256']) {
      headers['x-shopify-hmac-sha256'] = req.headers[
        'x-shopify-hmac-sha256'
      ] as string;
    }

    // Extract topic for webhook requests
    if (req.headers['x-shopify-topic']) {
      headers['x-shopify-topic'] = req.headers['x-shopify-topic'] as string;
    }

    // Add API version header for consistency
    if (req.headers['x-shopify-api-version']) {
      headers['x-shopify-api-version'] = req.headers[
        'x-shopify-api-version'
      ] as string;
    }

    return headers;
  }
}
