import { Controller, Get } from '@nestjs/common';
import { AppService } from '../services/app.service';

@Controller('api/app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
