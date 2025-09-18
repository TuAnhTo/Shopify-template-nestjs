import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Important for webhook signature verification
  });
  const logger = new Logger('Webhook Service');

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3003'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-*'],
  });

  // Global validation pipe (less strict for webhooks)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // Webhooks may have dynamic payloads
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.WEBHOOK_PORT || 3002;
  await app.listen(port);

  logger.log(`🪝 Webhook Service is running on port ${port}`);
  logger.log('📡 Available endpoints:');
  logger.log('   GET  /health -> Health Check');
  logger.log('   POST /webhooks/shopify -> Shopify Webhook Handler');
  logger.log('   POST /webhooks/auth -> Auth Webhook Handler');
}

void bootstrap();
