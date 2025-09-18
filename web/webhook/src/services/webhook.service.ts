import { Injectable, Logger } from '@nestjs/common';
import { WebhookRepository } from '../repositories/webhook.repository';
import {
  ShopifyOrderWebhook,
  ShopifyProductWebhook,
  ShopifyAppUninstallWebhook,
} from '../types/shopify-webhook.types';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly webhookRepository: WebhookRepository) {}

  async handleOrderCreate(payload: ShopifyOrderWebhook, shopDomain: string) {
    this.logger.log(`Order created webhook from ${shopDomain}`);

    await this.webhookRepository.saveWebhookEvent({
      type: 'orders/create',
      shopDomain,
      payload,
      processedAt: new Date(),
    });

    return { success: true, message: 'Order created webhook processed' };
  }

  async handleOrderUpdate(payload: ShopifyOrderWebhook, shopDomain: string) {
    this.logger.log(`Order updated webhook from ${shopDomain}`);

    await this.webhookRepository.saveWebhookEvent({
      type: 'orders/update',
      shopDomain,
      payload,
      processedAt: new Date(),
    });

    return { success: true, message: 'Order updated webhook processed' };
  }

  async handleProductCreate(
    payload: ShopifyProductWebhook,
    shopDomain: string,
  ) {
    this.logger.log(`Product created webhook from ${shopDomain}`);

    await this.webhookRepository.saveWebhookEvent({
      type: 'products/create',
      shopDomain,
      payload,
      processedAt: new Date(),
    });

    return { success: true, message: 'Product created webhook processed' };
  }

  async handleAppUninstall(
    payload: ShopifyAppUninstallWebhook,
    shopDomain: string,
  ) {
    this.logger.log(`App uninstalled webhook from ${shopDomain}`);

    await this.webhookRepository.saveWebhookEvent({
      type: 'app/uninstalled',
      shopDomain,
      payload,
      processedAt: new Date(),
    });

    return { success: true, message: 'App uninstall webhook processed' };
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'webhook',
      timestamp: new Date().toISOString(),
    };
  }
}
