export interface ShopifyWebhookHeaders {
  'x-shopify-hmac-sha256': string;
  'x-shopify-topic': string;
  'x-shopify-shop-domain': string;
  'x-shopify-webhook-id': string;
}

export interface ShopifyOrderWebhook {
  id: number;
  order_number: string;
  email: string;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  line_items: Array<{
    id: number;
    variant_id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ShopifyProductWebhook {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  status: 'active' | 'archived' | 'draft';
  tags: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    inventory_quantity: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ShopifyAppUninstallWebhook {
  domain?: string;
  myshopify_domain?: string;
  shop_domain?: string;
  uninstalled_at?: string;
}

export interface ShopifyCustomerWebhook {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

// GDPR Webhook Types
export interface ShopifyCustomerDataRequestWebhook {
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  shop_domain: string;
  orders_requested: number[];
}

export interface ShopifyCustomerRedactWebhook {
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  shop_domain: string;
  orders_to_redact: number[];
}

export interface ShopifyShopRedactWebhook {
  shop_domain: string;
  shop_id: number;
}

// Internal service interfaces
export interface ServiceResponse<T = any> {
  data?: T;
  message?: string;
  status: number;
}

export interface AppUninstallRequest {
  shop: string;
  uninstalledAt: string;
}

export interface CustomerDataResponse {
  customerId: string;
  shopDomain: string;
  message: string;
  collectedAt: string;
}

export type ShopifyWebhookPayload =
  | ShopifyOrderWebhook
  | ShopifyProductWebhook
  | ShopifyAppUninstallWebhook
  | ShopifyCustomerWebhook
  | ShopifyCustomerDataRequestWebhook
  | ShopifyCustomerRedactWebhook
  | ShopifyShopRedactWebhook;

export interface WebhookRequest {
  headers: ShopifyWebhookHeaders & Record<string, string>;
  body: string;
}
