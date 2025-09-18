import { Injectable, Logger } from '@nestjs/common';
import { ServiceConfigService } from '../config/service-config.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly serviceConfig: ServiceConfigService) {}

  async getOverallHealth() {
    const servicesHealth = await this.getServicesHealth();
    const allHealthy = servicesHealth.services.every(
      (service) => service.healthy,
    );

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      gateway: 'api-gateway',
      services: servicesHealth.services.length,
      healthy: servicesHealth.services.filter((s) => s.healthy).length,
    };
  }

  async getServicesHealth() {
    const services = this.serviceConfig.getAllServices();
    const healthChecks = await Promise.allSettled(
      services.map((service) => this.checkServiceHealth(service)),
    );

    const results = healthChecks.map((result, index) => {
      const service = services[index];

      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: service.name,
          url: service.url,
          healthy: false,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : 'Unknown error',
          responseTime: null,
        };
      }
    });

    return {
      timestamp: new Date().toISOString(),
      services: results,
    };
  }

  private async checkServiceHealth(service: { name: string; url: string }) {
    const startTime = Date.now();

    try {
      const response = await fetch(`${service.url}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      const healthy = response.ok;

      return {
        name: service.name,
        url: service.url,
        healthy,
        status: response.status,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        name: service.name,
        url: service.url,
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      };
    }
  }
}
