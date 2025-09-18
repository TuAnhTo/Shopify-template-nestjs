import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { WebhookRequest } from '../types/shopify-webhook.types';

@Injectable()
export class ShopifyWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<WebhookRequest>();
    const signature = request.headers['x-shopify-hmac-sha256'];
    const body = request.body;

    if (!signature) {
      throw new UnauthorizedException('Missing Shopify webhook signature');
    }

    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new UnauthorizedException('Webhook secret not configured');
    }

    const calculatedSignature = createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('base64');

    if (signature !== calculatedSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
