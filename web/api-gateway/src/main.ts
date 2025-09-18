import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('API Gateway');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    app.getHttpAdapter().getInstance()?.set?.('trust proxy', true);
  } catch {
    logger.warn('Could not set trust proxy setting');
  }

  // Enable graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.GATEWAY_PORT || 3003;
  await app.listen(port);

  const authPort = process.env.AUTH_PORT || 3001;
  const appPort = process.env.APP_PORT || 3000;
  const webhookPort = process.env.WEBHOOK_PORT || 3002;
  const shopifyPort = process.env.SHOPIFY_PORT || 3004;

  logger.log(`🚀 API Gateway running on http://localhost:${port}`);
  logger.log('📡 Available routes:');
  logger.log(`   🔐 /api/auth/*path -> Auth Service (port ${authPort})`);
  logger.log(`   📱 /api/app/*path -> App Service (port ${appPort})`);
  logger.log(
    `   🪝 /api/webhooks/*path -> Webhook Service (port ${webhookPort})`,
  );
  logger.log(
    `   🛍️  /api/shopify/*path -> Shopify Service (port ${shopifyPort})`,
  );
  logger.log('   ❤️  /health -> Health Check');
  logger.log('');
  logger.log('🎯 Shopify Authentication Endpoints:');
  logger.log('   POST /api/auth/shopify/token-exchange');
  logger.log('   GET  /api/auth/shopify/authorize');
  logger.log('   GET  /api/auth/shopify/session');
  logger.log('   POST /api/auth/shopify/logout');
}

void bootstrap();
