export interface ShopifyGraphQLProduct {
  id: string;
  title: string;
  handle: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  vendor: string;
  productType: string;
  tags: string[];
  description: string;
  priceRangeV2: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  totalInventory: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyGraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
  extensions?: Record<string, unknown>;
}

export interface ProductCreateInput {
  title: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  descriptionHtml?: string;
  variants?: Array<{
    price: string;
    inventoryQuantity?: number;
  }>;
}

export interface InstallationData {
  shop: string;
  accessToken: string;
  scope: string;
  isOnline?: boolean;
}

export interface ShopifySession {
  shop: string;
  accessToken: string;
  state: string;
  isOnline: boolean;
  scope: string;
  expires?: Date;
}

// Import from shared auth types
export interface ShopifySessionInfo {
  shop: string;
  userId: string;
  sessionId: string;
  sessionToken?: string;
}

export interface ShopifyApiCredentials {
  apiKey: string;
  apiSecret: string;
  scopes: string[];
  hostUrl: string;
}

export interface ProductQueryResponse {
  products: {
    edges: Array<{
      node: ShopifyGraphQLProduct;
    }>;
  };
}

export interface ProductCreateResponse {
  productCreate: {
    product: ShopifyGraphQLProduct;
    userErrors: Array<{
      field: string;
      message: string;
    }>;
  };
}
