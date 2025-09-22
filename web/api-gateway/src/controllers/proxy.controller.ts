import { Controller, All, Get, Req, Res, Query, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from '../services/proxy.service';

@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @Get('auth/shopify')
  async shopifyAuth(
    @Req() req: Request,
    @Res() res: Response,
    @Query('shop') shop: string,
  ) {
    this.logger.log(`OAuth initiation for shop: ${shop}`);
    return this.proxyService.forwardRequest(req, res, 'auth');
  }

  @Get('auth/shopify/callback')
  async shopifyCallback(@Req() req: Request, @Res() res: Response) {
    this.logger.log('OAuth callback received');
    return this.proxyService.forwardRequest(req, res, 'auth');
  }

  @All(['/app', '/app/*path'])
  async appRoutes(@Req() req: Request, @Res() res: Response) {
    this.logger.log(`App route: ${req.path}`);

    // Forward to app service for static serving
    return this.proxyService.forwardRequest(req, res, 'app');
  }

  @All('/api/auth/*path')
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forwardRequest(req, res, 'auth');
  }

  @All('/api/app/*path')
  async proxyApp(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forwardRequest(req, res, 'app');
  }

  @All('/api/shopify/*path')
  async proxyShopify(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forwardRequest(req, res, 'shopify');
  }

  @All('/api/webhooks/*path')
  async proxyWebhook(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forwardRequest(req, res, 'webhook');
  }

  @All('/api/config/*path')
  async proxyConfig(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forwardRequest(req, res, 'auth');
  }

  @Get('/health')
  getHealth() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    };
  }
}
