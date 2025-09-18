import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookController } from './controllers/webhook.controller';
import { AuthWebhookController } from './controllers/auth-webhook.controller';
import { WebhookService } from './services/webhook.service';
import { AuthWebhookService } from './services/auth-webhook.service';
import { WebhookRepository } from './repositories/webhook.repository';
import { ShopifyWebhookGuard } from './middleware/shopify-webhook.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  controllers: [WebhookController, AuthWebhookController],
  providers: [
    WebhookService,
    AuthWebhookService,
    WebhookRepository,
    ShopifyWebhookGuard,
  ],
  exports: [WebhookService, AuthWebhookService, WebhookRepository],
})
export class AppModule {}
