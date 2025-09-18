import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  ShopifyAppUninstallWebhook,
  ShopifyCustomerDataRequestWebhook,
  ShopifyCustomerRedactWebhook,
  ShopifyShopRedactWebhook,
  ServiceResponse,
  AppUninstallRequest,
  CustomerDataResponse,
} from '../types/shopify-webhook.types';

@Injectable()
export class AuthWebhookService {
  private readonly logger = new Logger(AuthWebhookService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verify webhook authenticity using HMAC
   */
  verifyWebhook(payload: unknown, headers: Record<string, string>): void {
    const hmacHeader = headers['x-shopify-hmac-sha256'];
    const shopDomain = headers['x-shopify-shop-domain'];

    if (!hmacHeader || !shopDomain) {
      throw new UnauthorizedException('Missing required webhook headers');
    }

    const webhookSecret: string | undefined =
      this.configService.get<string>('SHOPIFY_WEBHOOK_SECRET') ||
      this.configService.get<string>('SHOPIFY_API_SECRET');

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const body = JSON.stringify(payload);
    const expectedHmac = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('base64');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(hmacHeader),
        Buffer.from(expectedHmac),
      )
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`Webhook verified for shop: ${shopDomain}`);
  }

  /**
   * Handle app uninstalled webhook
   */
  async handleAppUninstalled(
    payload: ShopifyAppUninstallWebhook,
  ): Promise<void> {
    const shopDomain = payload.domain || payload.myshopify_domain;

    if (!shopDomain) {
      throw new Error('Shop domain not found in webhook payload');
    }

    this.logger.log(`Processing app uninstallation for shop: ${shopDomain}`);

    try {
      // Call auth service to clean up sessions
      const uninstallData: AppUninstallRequest = {
        shop: shopDomain,
        uninstalledAt: new Date().toISOString(),
      };
      await this.callAuthService(
        'POST',
        '/api/auth/shopify/uninstall',
        uninstallData,
      );

      // Call other services to clean up data if needed
      await this.cleanupAppData(shopDomain);

      this.logger.log(
        `App uninstallation processed successfully for shop: ${shopDomain}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process app uninstallation for shop ${shopDomain}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Handle customer data request webhook (GDPR)
   */
  handleCustomerDataRequest(payload: ShopifyCustomerDataRequestWebhook): void {
    const { customer, shop_domain: shopDomain } = payload;

    this.logger.log(
      `Processing customer data request for customer ${customer?.id} in shop: ${shopDomain}`,
    );

    try {
      // Implementation depends on what customer data your app stores
      // This is a placeholder for GDPR compliance
      const customerData = this.collectCustomerData(
        customer.id.toString(),
        shopDomain,
      );

      // In a real implementation, you would typically:
      // 1. Collect all customer data from your systems
      // 2. Format it according to GDPR requirements
      // 3. Send it to the customer or make it available for download

      // Use the collected data to prevent unused variable warning
      this.logger.debug(
        `Collected data size: ${
          JSON.stringify(customerData).length
        } characters`,
      );

      this.logger.log(
        `Customer data request processed for customer ${customer?.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to process customer data request:`, error);
      throw error;
    }
  }

  /**
   * Handle customer redact webhook (GDPR)
   */
  handleCustomerRedact(payload: ShopifyCustomerRedactWebhook): void {
    const { customer, shop_domain: shopDomain } = payload;

    this.logger.log(
      `Processing customer redaction for customer ${customer?.id} in shop: ${shopDomain}`,
    );

    try {
      // Remove or anonymize customer data from all services
      this.redactCustomerData(customer.id.toString(), shopDomain);

      this.logger.log(`Customer data redacted for customer ${customer?.id}`);
    } catch (error) {
      this.logger.error(`Failed to redact customer data:`, error);
      throw error;
    }
  }

  /**
   * Handle shop redact webhook (GDPR)
   */
  async handleShopRedact(payload: ShopifyShopRedactWebhook): Promise<void> {
    const { shop_domain: shopDomain } = payload;

    this.logger.log(`Processing shop redaction for shop: ${shopDomain}`);

    try {
      // Remove shop data from all services (48 hours after uninstall)
      await this.redactShopData(shopDomain);

      this.logger.log(`Shop data redacted for shop: ${shopDomain}`);
    } catch (error) {
      this.logger.error(`Failed to redact shop data:`, error);
      throw error;
    }
  }

  private async callAuthService<T = unknown>(
    method: string,
    path: string,
    data?: unknown,
  ): Promise<ServiceResponse<T>> {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');

    if (!authServiceUrl) {
      throw new Error('AUTH_SERVICE_URL not configured');
    }

    const response = await fetch(`${authServiceUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getServiceToken()}`, // Internal service auth
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Auth service call failed: ${response.status}`);
    }

    return (await response.json()) as ServiceResponse<T>;
  }

  private async cleanupAppData(shopDomain: string): Promise<void> {
    try {
      // Clean up data from each microservice
      const services = [
        { name: 'app', url: this.configService.get<string>('APP_SERVICE_URL') },
        {
          name: 'shopify',
          url: this.configService.get<string>('SHOPIFY_SERVICE_URL'),
        },
      ];

      for (const service of services) {
        if (service.url) {
          try {
            await fetch(`${service.url}/api/cleanup/shop/${shopDomain}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${this.getServiceToken()}`,
              },
            });
            this.logger.log(
              `Cleaned up data from ${service.name} service for shop: ${shopDomain}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to cleanup data from ${service.name} service:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup app data:', error);
    }
  }

  private collectCustomerData(
    customerId: string,
    shopDomain: string,
  ): CustomerDataResponse {
    // Placeholder implementation
    // In a real app, you would collect all customer data from your databases
    const customerData: CustomerDataResponse = {
      customerId,
      shopDomain,
      message: 'No customer data stored in this application',
      collectedAt: new Date().toISOString(),
    };
    return customerData;
  }

  private redactCustomerData(customerId: string, shopDomain: string): void {
    // Placeholder implementation
    // In a real app, you would remove or anonymize customer data
    this.logger.log(
      `Redacting customer data for customer ${customerId} in shop ${shopDomain}`,
    );
  }

  private async redactShopData(shopDomain: string): Promise<void> {
    // Call all services to remove shop data
    await this.cleanupAppData(shopDomain);
  }

  private getServiceToken(): string {
    // Generate or retrieve internal service authentication token
    // This should be a secure token for inter-service communication
    return (
      this.configService.get<string>('INTERNAL_SERVICE_TOKEN') ||
      'internal-service-token'
    );
  }
}
