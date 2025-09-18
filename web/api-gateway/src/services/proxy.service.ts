import { Injectable, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ServiceConfigService } from '../config/service-config.service';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly serviceConfig: ServiceConfigService) {}

  async forwardRequest(req: Request, res: Response, serviceName: string) {
    console.log(serviceName);
    try {
      const serviceUrl = this.serviceConfig.getServiceUrl(serviceName);

      if (!serviceUrl) {
        this.logger.error(`Service ${serviceName} not found`);
        return res.status(503).json({
          error: 'Service unavailable',
          service: serviceName,
        });
      }

      this.logger.log(
        `Forwarding ${req.method} ${req.url} to ${serviceName} service`,
      );

      // Construct target URL
      const targetUrl = `${serviceUrl}${req.url}`;

      // Forward request using fetch
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: this.filterHeaders(
          req.headers,
          req['shopifyHeaders'] as Record<string, string>,
        ),
        body:
          req.method !== 'GET' && req.method !== 'HEAD'
            ? JSON.stringify(req.body)
            : undefined,
      });

      // Copy response headers
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Set status and send response
      res.status(response.status);

      const responseBody = await response.text();
      res.send(responseBody);
    } catch (error) {
      this.logger.error(`Error forwarding request to ${serviceName}:`, error);
      res.status(500).json({
        error: 'Gateway error',
        message: 'Failed to forward request',
      });
    }
  }

  private filterHeaders(
    headers: any,
    shopifyHeaders?: Record<string, string>,
  ): Record<string, string> {
    const filtered: Record<string, string> = {};

    // Copy important headers
    const allowedHeaders = [
      'content-type',
      'authorization',
      'x-shopify-hmac-sha256',
      'x-shopify-shop-domain',
      'x-shopify-access-token',
      'user-agent',
      'accept',
    ];

    for (const [key, value] of Object.entries(
      headers as Record<string, unknown>,
    )) {
      if (
        allowedHeaders.includes(key.toLowerCase()) &&
        typeof value === 'string'
      ) {
        filtered[key] = value;
      }
    }

    // Add Shopify-specific headers if provided
    if (shopifyHeaders) {
      Object.assign(filtered, shopifyHeaders);
    }

    return filtered;
  }
}
