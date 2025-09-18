import { Request } from 'express';

export interface ShopifyHeaders {
  'x-shopify-hmac-sha256'?: string;
  'x-shopify-shop-domain'?: string;
  'x-shopify-access-token'?: string;
  'x-shopify-webhook-id'?: string;
  'x-shopify-topic'?: string;
}

export interface ProxyRequest extends Request {
  shopifyHeaders?: ShopifyHeaders;
  currentAppUrl?: string;
  isShopifyCliDomain?: boolean;
}

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CorsOptions {
  origin: string | boolean | RegExp | Array<string | RegExp>;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  credentials?: boolean;
}

export interface ProxyConfig {
  target: string;
  changeOrigin: boolean;
  pathRewrite?: Record<string, string>;
  timeout?: number;
}

export interface ServiceHealthCheck {
  name: string;
  url: string;
  healthy: boolean;
  status?: number;
  responseTime: number | null;
  error?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  gateway: string;
  services: number;
  healthy: number;
}

export interface ServicesHealthResponse {
  timestamp: string;
  services: ServiceHealthCheck[];
}

export interface ShopifyErrorResponse {
  success: boolean;
  error: string;
  statusCode: number;
  timestamp: string;
  message?: string;
  code?: string;
}

export interface Service {
  name: string;
  url: string;
}

export interface CorsOriginCallback {
  (error: Error | null, allow?: boolean): void;
}

export interface ExtendedRequest extends Request {
  currentAppUrl?: string;
  isShopifyCliDomain?: boolean;
}

export type ConfigValue = string | undefined;
