import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ProxyController } from './controllers/proxy.controller';
import { HealthController } from './controllers/health.controller';
import { ShopifyAuthController } from './controllers/shopify-auth.controller';
import { ProxyService } from './services/proxy.service';
import { HealthService } from './services/health.service';
import { ShopifyAuthService } from './services/shopify-auth.service';
import { ServiceConfigService } from './config/service-config.service';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { ShopifyAuthMiddleware } from './middleware/shopify-auth.middleware';
import { CorsMiddleware } from './middleware/cors.middleware';
import { ErrorHandlerMiddleware } from './middleware/error-handler.middleware';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env', '.env.local'],
    }),
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [ShopifyAuthController, ProxyController, HealthController],
  providers: [
    ProxyService,
    HealthService,
    ShopifyAuthService,
    ServiceConfigService,
    ShopifyAuthMiddleware,
    CorsMiddleware,
    ErrorHandlerMiddleware,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    consumer
      .apply(ErrorHandlerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    consumer
      .apply(LoggingMiddleware, RateLimitMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    consumer
      .apply(ShopifyAuthMiddleware)
      .forRoutes(
        { path: '/api/auth/shopify*path', method: RequestMethod.ALL },
        { path: '/api/shopify*path', method: RequestMethod.ALL },
      );
  }
}
