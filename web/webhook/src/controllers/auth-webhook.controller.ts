import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { AuthWebhookService } from '../services/auth-webhook.service';
import type {
  ShopifyAppUninstallWebhook,
  ShopifyCustomerDataRequestWebhook,
  ShopifyCustomerRedactWebhook,
  ShopifyShopRedactWebhook,
} from '../types/shopify-webhook.types';

@Controller('webhooks/auth')
export class AuthWebhookController {
  private readonly logger = new Logger(AuthWebhookController.name);

  constructor(private readonly authWebhookService: AuthWebhookService) {}

  @Post('app/uninstalled')
  @HttpCode(200)
  async handleAppUninstalled(
    @Body() payload: ShopifyAppUninstallWebhook,
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.log('Received app/uninstalled webhook');

    try {
      // Verify webhook authenticity
      this.authWebhookService.verifyWebhook(payload, headers);

      // Process app uninstallation
      await this.authWebhookService.handleAppUninstalled(payload);

      return { status: 'success' };
    } catch (error) {
      this.logger.error('Failed to process app/uninstalled webhook:', error);
      throw error;
    }
  }

  @Post('customers/data_request')
  @HttpCode(200)
  handleCustomerDataRequest(
    @Body() payload: ShopifyCustomerDataRequestWebhook,
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.log('Received customers/data_request webhook');

    try {
      this.authWebhookService.verifyWebhook(payload, headers);
      this.authWebhookService.handleCustomerDataRequest(payload);
      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        'Failed to process customers/data_request webhook:',
        error,
      );
      throw error;
    }
  }

  @Post('customers/redact')
  @HttpCode(200)
  handleCustomerRedact(
    @Body() payload: ShopifyCustomerRedactWebhook,
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.log('Received customers/redact webhook');

    try {
      this.authWebhookService.verifyWebhook(payload, headers);
      this.authWebhookService.handleCustomerRedact(payload);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Failed to process customers/redact webhook:', error);
      throw error;
    }
  }

  @Post('shop/redact')
  @HttpCode(200)
  async handleShopRedact(
    @Body() payload: ShopifyShopRedactWebhook,
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.log('Received shop/redact webhook');

    try {
      this.authWebhookService.verifyWebhook(payload, headers);
      await this.authWebhookService.handleShopRedact(payload);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Failed to process shop/redact webhook:', error);
      throw error;
    }
  }
}
