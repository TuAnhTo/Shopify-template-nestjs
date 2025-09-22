import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Shopify Service');

  // Enable CORS for cross-origin requests
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3003',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-*'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.SHOPIFY_PORT || 3004;
  await app.listen(port);

  logger.log(`🛍️  Shopify Service is running on port ${port}`);
  logger.log('📡 Available endpoints:');
  logger.log('   GET  /health -> Health Check');
  logger.log('   POST /graphql -> Shopify GraphQL API');
  logger.log('   GET  /products -> Get Products');
  logger.log('   POST /webhooks/install -> Install Webhooks');
}

void bootstrap();
