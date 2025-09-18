import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  PublicConfig,
  HealthCheckResponse,
  FrontendConfig,
} from '../types/shopify.types';

@Controller('api/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getPublicConfig(): PublicConfig {
    const apiKey = this.configService.get<string>('SHOPIFY_API_KEY') || '';
    const appUrl =
      this.configService.get<string>('SHOPIFY_APP_URL') ||
      this.configService.get<string>('APP_URL') ||
      process.env.SHOPIFY_APP_URL ||
      'http://localhost:3001';

    return {
      shopifyApiKey: apiKey,
      shopifyScopes:
        this.configService.get<string>('SHOPIFY_SCOPES') ||
        'read_products,write_products',
      appUrl,
      embedded: this.configService.get<string>('SHOPIFY_EMBEDDED') !== 'false',
      environment: this.configService.get<string>('NODE_ENV') || 'development',
      authFlow: 'session-tokens',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth(): HealthCheckResponse {
    const hasApiKey = !!this.configService.get<string>('SHOPIFY_API_KEY');
    const hasSecret = !!this.configService.get<string>('SHOPIFY_API_SECRET');

    return {
      status: hasApiKey && hasSecret ? 'healthy' : 'unhealthy',
      service: 'auth-config',
      timestamp: new Date().toISOString(),
      configuration: {
        hasApiKey,
        hasSecret,
      },
    };
  }

  @Get('frontend')
  getFrontendConfig(): FrontendConfig {
    return {
      apiKey: this.configService.get<string>('SHOPIFY_API_KEY') || '',
      authFlow: 'session-tokens',
      tokenValidationEndpoint: '/api/auth/validate',
      tokenExchangeEndpoint: '/api/auth/exchange',
      sessionEndpoint: '/api/auth/session',
      embedded: true,
    };
  }
}
