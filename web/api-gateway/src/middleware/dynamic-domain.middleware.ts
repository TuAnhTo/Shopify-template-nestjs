import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { ExtendedRequest, ConfigValue } from '../types/proxy.types';

@Injectable()
export class DynamicDomainMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DynamicDomainMiddleware.name);
  private currentAppUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.currentAppUrl = this.configService.get<ConfigValue>('APP_URL') || '';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const extendedReq = req as ExtendedRequest;

    // Check if this is a request from Shopify CLI with a new domain
    const host = req.get('host');
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}`;

    // Detect if this is a new Shopify CLI domain
    if (this.isShopifyCliDomain(fullUrl) && fullUrl !== this.currentAppUrl) {
      this.updateAppUrl(fullUrl);
    }

    // Add current app URL to request for services to use
    extendedReq.currentAppUrl = this.currentAppUrl;
    extendedReq.isShopifyCliDomain = this.isShopifyCliDomain(fullUrl);

    next();
  }

  private isShopifyCliDomain(url: string): boolean {
    return url.includes('trycloudflare.com');
  }

  private updateAppUrl(newUrl: string): void {
    if (this.currentAppUrl !== newUrl) {
      this.logger.log(`🔄 Detected new Shopify CLI domain: ${newUrl}`);

      // Update environment variables
      process.env.APP_URL = newUrl;
      process.env.SHOPIFY_APP_URL = newUrl;
      process.env.HOST_NAME = new URL(newUrl).hostname;

      this.currentAppUrl = newUrl;

      // Notify other services about the domain change
      void this.notifyServicesOfDomainChange(newUrl);
    }
  }

  private async notifyServicesOfDomainChange(newUrl: string): Promise<void> {
    const services = [
      { name: 'auth', url: this.configService.get<string>('AUTH_SERVICE_URL') },
      {
        name: 'shopify',
        url: this.configService.get<string>('SHOPIFY_SERVICE_URL'),
      },
      {
        name: 'webhook',
        url: this.configService.get<string>('WEBHOOK_SERVICE_URL'),
      },
    ];

    for (const service of services) {
      if (service.url) {
        try {
          await fetch(`${service.url}/api/config/update-app-url`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.configService.get(
                'INTERNAL_SERVICE_TOKEN',
              )}`,
            },
            body: JSON.stringify({ appUrl: newUrl }),
          });

          this.logger.log(
            `✅ Notified ${service.name} service of domain change`,
          );
        } catch (error) {
          this.logger.warn(
            `⚠️ Failed to notify ${service.name} service:`,
            error instanceof Error ? error.message : 'Unknown error',
          );
        }
      }
    }
  }

  /**
   * Get current app URL
   */
  getCurrentAppUrl(): string {
    return this.currentAppUrl;
  }
}
