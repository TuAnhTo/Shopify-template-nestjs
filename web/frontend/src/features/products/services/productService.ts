import { productsApi } from "@/services";

/**
 * Product service for feature-specific logic
 */
export const productService = {
  ...productsApi,

  /**
   * Additional business logic specific to products feature can go here
   */
};
