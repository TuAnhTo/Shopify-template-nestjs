import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface RateLimitData {
  requests: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly clients = new Map<string, RateLimitData>();
  private readonly maxRequests = 100; // requests per window
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  use(req: Request, res: Response, next: NextFunction) {
    const clientId = this.getClientId(req);
    const now = Date.now();

    // Get or create client data
    let clientData = this.clients.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      clientData = {
        requests: 0,
        resetTime: now + this.windowMs,
      };
    }

    clientData.requests++;
    this.clients.set(clientId, clientData);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, this.maxRequests - clientData.requests),
    );
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000));

    // Check if limit exceeded
    if (clientData.requests > this.maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
      return;
    }

    next();
  }

  private getClientId(req: Request): string {
    // Use IP address as client identifier
    // In production, you might want to use user ID for authenticated requests
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
