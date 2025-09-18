import { Injectable } from '@nestjs/common';

export interface ServiceConfig {
  name: string;
  url: string;
  port: number;
}

@Injectable()
export class ServiceConfigService {
  private readonly services: ServiceConfig[] = [
    {
      name: 'auth',
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      port: 3001,
    },
    {
      name: 'app',
      url: process.env.APP_SERVICE_URL || 'http://localhost:3000',
      port: 3000,
    },
    {
      name: 'webhook',
      url: process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3002',
      port: 3002,
    },
    {
      name: 'shopify',
      url: process.env.SHOPIFY_SERVICE_URL || 'http://localhost:3004',
      port: 3004,
    },
  ];

  getServiceUrl(serviceName: string): string | null {
    const service = this.services.find((s) => s.name === serviceName);
    return service ? service.url : null;
  }

  getAllServices(): ServiceConfig[] {
    return this.services;
  }

  getServiceByName(name: string): ServiceConfig | null {
    return this.services.find((s) => s.name === name) || null;
  }
}
