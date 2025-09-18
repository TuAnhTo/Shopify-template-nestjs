import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Allow Shopify admin domains
    const allowedOrigins = [
      /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/,
      /^https:\/\/admin\.shopify\.com$/,
      'https://localhost:3000', // Development
      'http://localhost:3000', // Development
    ];

    const origin = req.headers.origin;
    let isAllowed = false;

    if (origin) {
      isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        return allowed.test(origin);
      });
    }

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin!);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Shopify-Shop-Domain, X-Shopify-Hmac-Sha256, X-Shopify-Access-Token',
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }
}
