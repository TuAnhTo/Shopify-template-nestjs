import { CorsOptions } from 'cors';
import { ConfigService } from '@nestjs/config';
import { CorsOriginCallback, ConfigValue } from '../types/proxy.types';

export class CorsConfig {
  static create(configService: ConfigService): CorsOptions {
    const allowDynamicDomains =
      configService.get<ConfigValue>('ALLOW_DYNAMIC_DOMAINS') === 'true';
    const corsOrigin = configService.get<ConfigValue>('CORS_ORIGIN');
    const allowedPatternsValue = configService.get<ConfigValue>(
      'CORS_ALLOWED_PATTERNS',
    );
    const allowedPatterns = allowedPatternsValue?.split(',') || [];

    return {
      origin: (origin: string | undefined, callback: CorsOriginCallback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Always allow main app URL
        if (origin === corsOrigin) {
          return callback(null, true);
        }

        // If dynamic domains are allowed, check patterns
        if (allowDynamicDomains) {
          const isAllowed = allowedPatterns.some((pattern: string) => {
            if (pattern.includes('*')) {
              // Convert wildcard pattern to regex
              const regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*');
              const regex = new RegExp(`^https?://${regexPattern}$`);
              return regex.test(origin);
            }
            return origin.includes(pattern);
          });

          if (isAllowed) {
            return callback(null, true);
          }
        }

        // Check for localhost and development URLs
        if (process.env.NODE_ENV === 'development') {
          if (
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('trycloudflare.com')
          ) {
            return callback(null, true);
          }
        }

        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      },
      credentials:
        configService.get<ConfigValue>('CORS_CREDENTIALS') === 'true',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Shopify-Topic',
        'X-Shopify-Hmac-Sha256',
        'X-Shopify-Shop-Domain',
        'X-Shopify-Access-Token',
      ],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400, // 24 hours
    };
  }

  /**
   * Dynamic origin validator for Shopify CLI generated domains
   */
  static isValidShopifyCliDomain(origin: string): boolean {
    // Shopify CLI typically generates domains like: https://random-words-numbers.trycloudflare.com
    const shopifyCliPattern = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/;
    return shopifyCliPattern.test(origin);
  }

  /**
   * Update app URL dynamically (useful for CLI development)
   */
  static updateAppUrl(newUrl: string): void {
    // In a real implementation, you might want to update the config service
    // or store the dynamic URL in a cache/database
    process.env.APP_URL = newUrl;
    process.env.SHOPIFY_APP_URL = newUrl;

    console.log(`🔄 App URL updated to: ${newUrl}`);
  }
}
