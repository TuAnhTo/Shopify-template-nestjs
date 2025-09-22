import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ShopifySessionInfo, ShopifyRequest } from './shopify-auth.guard';

/**
 * Decorator to extract Shopify session information from request
 *
 * Usage:
 * @Get('example')
 * async example(@ShopifySession() session: ShopifySessionInfo) {
 *   console.log('Shop:', session.shop);
 *   console.log('User ID:', session.userId);
 * }
 */
export const ShopifySession = createParamDecorator(
  (
    data: keyof ShopifySessionInfo | undefined,
    ctx: ExecutionContext,
  ): ShopifySessionInfo | any => {
    const request = ctx.switchToHttp().getRequest<ShopifyRequest>();
    const session = request.shopifySession;

    if (!session) {
      throw new Error(
        'Shopify session not found. Make sure ShopifyAuthGuard is applied.',
      );
    }

    // If specific property is requested, return that property
    if (data) {
      return session[data];
    }

    // Return full session info
    return session;
  },
);

/**
 * Decorator to extract shop domain from Shopify session
 *
 * Usage:
 * @Get('example')
 * async example(@ShopifyShop() shop: string) {
 *   console.log('Shop domain:', shop);
 * }
 */
export const ShopifyShop = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<ShopifyRequest>();
    const shop = request.shop;

    if (!shop) {
      throw new Error(
        'Shop information not found. Make sure ShopifyAuthGuard is applied.',
      );
    }

    return shop;
  },
);

/**
 * Decorator to extract user ID from Shopify session
 *
 * Usage:
 * @Get('example')
 * async example(@ShopifyUser() userId: string) {
 *   console.log('User ID:', userId);
 * }
 */
export const ShopifyUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<ShopifyRequest>();
    const userId = request.userId;

    if (!userId) {
      throw new Error(
        'User information not found. Make sure ShopifyAuthGuard is applied.',
      );
    }

    return userId;
  },
);
