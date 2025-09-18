import { Injectable, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class StaticService {
  private readonly logger = new Logger(StaticService.name);

  serveIndexHtml(req: Request, res: Response) {
    return this.serveStaticFile(req, res);
  }

  serveStaticFile(req: Request, res: Response) {
    try {
      const STATIC_PATH =
        process.env.NODE_ENV === 'production'
          ? `${process.cwd()}/frontend/dist`
          : `${process.cwd()}/../frontend/`;

      const indexPath = join(STATIC_PATH, 'index.html');

      if (!existsSync(indexPath)) {
        this.logger.error(`Index.html not found at: ${indexPath}`);
        return res.status(404).json({ message: 'Frontend not found' });
      }

      const htmlContent = readFileSync(indexPath)
        .toString()
        .replace(
          '%VITE_SHOPIFY_API_KEY%',
          process.env.VITE_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY || '',
        );

      res
        .status(200)
        .set('Content-Type', 'text/html')
        .set('Cache-Control', 'no-cache')
        .send(htmlContent);

      this.logger.log(`Served index.html for ${req.originalUrl}`);
    } catch (error) {
      this.logger.error('Error serving index.html:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
