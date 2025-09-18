import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IShopifyClient,
  ShopifyShopInfo,
  ShopifyProduct,
  WebhookConfig,
  ShopifyWebhook,
} from '../interfaces/shopify-client.interface';

@Injectable()
export class ShopifyClientService implements IShopifyClient {
  private readonly logger = new Logger(ShopifyClientService.name);
  private readonly shopifyServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.shopifyServiceUrl =
      this.configService.get('SHOPIFY_SERVICE_URL') || 'http://localhost:3004';
  }

  async getShopInfo(
    shop: string,
    accessToken: string,
  ): Promise<ShopifyShopInfo> {
    try {
      const response = await fetch(
        `${this.shopifyServiceUrl}/api/shopify/shop/info`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Shop-Domain': shop,
            'X-Shopify-Access-Token': accessToken,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get shop info: ${response.statusText}`);
      }

      const data = (await response.json()) as { shop: ShopifyShopInfo };
      return data.shop;
    } catch (error) {
      this.logger.error(`Error getting shop info for ${shop}:`, error);
      throw error;
    }
  }

  async validateAccessToken(
    shop: string,
    accessToken: string,
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.shopifyServiceUrl}/api/shopify/auth/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Shop-Domain': shop,
            'X-Shopify-Access-Token': accessToken,
          },
        },
      );

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as { valid: boolean };
      return data.valid === true;
    } catch (error) {
      this.logger.error(`Error validating access token for ${shop}:`, error);
      return false;
    }
  }

  async getProducts(
    shop: string,
    accessToken: string,
  ): Promise<ShopifyProduct[]> {
    try {
      const response = await fetch(
        `${this.shopifyServiceUrl}/api/shopify/products`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Shop-Domain': shop,
            'X-Shopify-Access-Token': accessToken,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get products: ${response.statusText}`);
      }

      const data = (await response.json()) as { products: ShopifyProduct[] };
      return data.products || [];
    } catch (error) {
      this.logger.error(`Error getting products for ${shop}:`, error);
      throw error;
    }
  }

  async createWebhook(
    shop: string,
    accessToken: string,
    webhook: WebhookConfig,
  ): Promise<ShopifyWebhook> {
    try {
      const response = await fetch(
        `${this.shopifyServiceUrl}/api/shopify/webhooks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Shop-Domain': shop,
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify(webhook),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to create webhook: ${response.statusText}`);
      }

      const data = (await response.json()) as { webhook: ShopifyWebhook };
      return data.webhook;
    } catch (error) {
      this.logger.error(`Error creating webhook for ${shop}:`, error);
      throw error;
    }
  }
}
