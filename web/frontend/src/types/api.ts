export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
}

export interface ProductsCountResponse {
  count: number;
}

export interface CreateProductResponse {
  success: boolean;
  error?: string;
}

export interface ShopifySession {
  shop: string;
  accessToken: string;
}

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
}
