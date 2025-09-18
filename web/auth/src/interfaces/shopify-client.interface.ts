/**
 * Interface để tương tác với Shopify service theo nguyên tắc SOLID
 * Dependency Inversion Principle - phụ thuộc vào abstraction, không phụ thuộc vào concrete class
 */
export interface IShopifyClient {
  /**
   * Lấy thông tin shop từ Shopify service
   */
  getShopInfo(shop: string, accessToken: string): Promise<ShopifyShopInfo>;

  /**
   * Validate access token với Shopify
   */
  validateAccessToken(shop: string, accessToken: string): Promise<boolean>;

  /**
   * Lấy danh sách products từ Shopify service
   */
  getProducts(shop: string, accessToken: string): Promise<ShopifyProduct[]>;

  /**
   * Tạo webhook subscription
   */
  createWebhook(
    shop: string,
    accessToken: string,
    webhook: WebhookConfig,
  ): Promise<ShopifyWebhook>;
}

export interface ShopifyShopInfo {
  id: string;
  name: string;
  domain: string;
  email: string;
  currency: string;
  timezone: string;
  plan?: {
    name: string;
    displayName: string;
  };
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  price: string;
  inventory: number;
  status: string;
}

export interface WebhookConfig {
  topic: string;
  address: string;
  format: 'json' | 'xml';
}

export interface ShopifyWebhook {
  id: string;
  topic: string;
  address: string;
  createdAt: string;
}
