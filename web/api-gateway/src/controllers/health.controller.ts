import { Controller, Get } from '@nestjs/common';
import { HealthService } from '../services/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    return this.healthService.getOverallHealth();
  }

  @Get('services')
  async getServicesHealth() {
    return this.healthService.getServicesHealth();
  }
}
