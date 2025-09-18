import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware đặc biệt cho Shopify requests
 */
@Injectable()
export class ErrorHandlerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ErrorHandlerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // Handle errors that occur during request processing
    const originalSend = res.send;
    const logger = this.logger;
    const isShopifyRequestFn = (request: Request): boolean =>
      this.isShopifyRequest(request);
    const formatShopifyErrorFn = (
      statusCode: number,
      bodyContent: any,
    ): object => this.formatShopifyError(statusCode, bodyContent);

    res.send = function (body: any): Response {
      // Log errors for debugging
      if (res.statusCode >= 400) {
        const shopDomain =
          (req.headers['x-shopify-shop-domain'] as string) ||
          (typeof req.query.shop === 'string' ? req.query.shop : undefined);

        const requestBody = req.body as unknown;

        logger.error(`Error ${res.statusCode} for ${req.method} ${req.url}`, {
          statusCode: res.statusCode,
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: requestBody,
          shop: shopDomain,
        });

        // Add Shopify-specific error handling
        if (isShopifyRequestFn(req)) {
          const errorResponse = formatShopifyErrorFn(res.statusCode, body);
          return originalSend.call(
            this,
            JSON.stringify(errorResponse),
          ) as Response;
        }
      }

      return originalSend.call(this, body) as Response;
    };

    next();
  }

  private isShopifyRequest(req: Request): boolean {
    return !!(
      req.headers['x-shopify-shop-domain'] ||
      req.headers['x-shopify-hmac-sha256'] ||
      req.query.shop ||
      req.url.includes('/api/auth/shopify') ||
      req.url.includes('/api/shopify')
    );
  }

  private formatShopifyError(statusCode: number, body: any): object {
    const baseError = {
      success: false,
      error: 'Gateway Error',
      statusCode,
      timestamp: new Date().toISOString(),
    };

    // Handle specific Shopify error cases
    switch (statusCode) {
      case 401:
        return {
          ...baseError,
          error: 'Authentication Failed',
          message: 'Invalid or expired session token. Please re-authenticate.',
          code: 'SHOPIFY_AUTH_FAILED',
        };
      case 403:
        return {
          ...baseError,
          error: 'Access Denied',
          message: 'Insufficient permissions for this shop.',
          code: 'SHOPIFY_ACCESS_DENIED',
        };
      case 503:
        return {
          ...baseError,
          error: 'Service Unavailable',
          message: 'Shopify service is temporarily unavailable.',
          code: 'SHOPIFY_SERVICE_UNAVAILABLE',
        };
      default:
        return {
          ...baseError,
          message: typeof body === 'string' ? body : JSON.stringify(body),
        };
    }
  }
}
