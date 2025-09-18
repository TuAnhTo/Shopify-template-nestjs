import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { StaticService } from '../services/static.service';

@Controller()
export class StaticController {
  constructor(private readonly staticService: StaticService) {}

  @Get('/')
  serveStatic(@Req() req: Request, @Res() res: Response) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }

    // For embedded Shopify apps, serve the frontend HTML with API key replacement
    return this.staticService.serveIndexHtml(req, res);
  }
}
