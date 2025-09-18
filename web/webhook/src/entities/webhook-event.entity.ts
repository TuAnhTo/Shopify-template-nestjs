import { ShopifyWebhookPayload } from '../types/shopify-webhook.types';

export class WebhookEvent {
  id: string;
  type: string;
  shopDomain: string;
  payload: ShopifyWebhookPayload;
  processedAt: Date;
  createdAt: Date;
}
