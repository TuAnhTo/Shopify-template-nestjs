import { apiClient } from "./base";
import { API_ENDPOINTS } from "@/constants";
import { ProductsCountResponse, CreateProductResponse } from "@/types";

export const productsApi = {
  /**
   * Get products count from API
   */
  async getProductsCount(): Promise<ProductsCountResponse> {
    const response = await apiClient.get<ProductsCountResponse>(
      API_ENDPOINTS.PRODUCTS.COUNT
    );
    return response.data || response;
  },

  /**
   * Create products via API
   */
  async createProducts(): Promise<CreateProductResponse> {
    const response = await apiClient.post<CreateProductResponse>(
      API_ENDPOINTS.PRODUCTS.CREATE
    );
    return response.data || response;
  },
};
