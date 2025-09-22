import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { WebhookService } from '../services/webhook.service';
import { ShopifyWebhookGuard } from '../middleware/shopify-webhook.guard';
import type {
  ShopifyOrderWebhook,
  ShopifyProductWebhook,
  ShopifyAppUninstallWebhook,
} from '../types/shopify-webhook.types';

@Controller('api/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('orders/create')
  @UseGuards(ShopifyWebhookGuard)
  async handleOrderCreate(
    @Body() payload: ShopifyOrderWebhook,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.webhookService.handleOrderCreate(payload, shopDomain);
  }

  @Post('orders/update')
  @UseGuards(ShopifyWebhookGuard)
  async handleOrderUpdate(
    @Body() payload: ShopifyOrderWebhook,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.webhookService.handleOrderUpdate(payload, shopDomain);
  }

  @Post('products/create')
  @UseGuards(ShopifyWebhookGuard)
  async handleProductCreate(
    @Body() payload: ShopifyProductWebhook,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.webhookService.handleProductCreate(payload, shopDomain);
  }

  @Post('app/uninstalled')
  @UseGuards(ShopifyWebhookGuard)
  async handleAppUninstall(
    @Body() payload: ShopifyAppUninstallWebhook,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    return this.webhookService.handleAppUninstall(payload, shopDomain);
  }

  @Get('health')
  getHealth() {
    return this.webhookService.getHealth();
  }
}
