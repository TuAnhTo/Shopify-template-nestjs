import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { productsApi } from "@/services";
import { DEFAULT_PRODUCTS_COUNT } from "@/constants";
import { ProductsCountResponse } from "@/types";

export const QUERY_KEYS = {
  PRODUCTS_COUNT: "productCount",
} as const;

export function useProductsCount() {
  const { data, isLoading, error, refetch } = useQuery<ProductsCountResponse>({
    queryKey: [QUERY_KEYS.PRODUCTS_COUNT],
    queryFn: productsApi.getProductsCount,
    refetchOnWindowFocus: false,
  });

  return {
    count: data?.count,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateProducts() {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const shopify = useAppBridge();
  const { t } = useTranslation();

  const createProducts = async () => {
    setIsCreating(true);
    shopify.loading(true);

    try {
      const response = await productsApi.createProducts();

      if (response.success) {
        // Invalidate and refetch products count
        await queryClient.invalidateQueries([QUERY_KEYS.PRODUCTS_COUNT]);

        shopify.toast.show(
          t("ProductsCard.productsCreatedToast", {
            count: DEFAULT_PRODUCTS_COUNT,
          })
        );
      } else {
        throw new Error(response.error || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to create products:", error);
      shopify.toast.show(t("ProductsCard.errorCreatingProductsToast"), {
        isError: true,
      });
    } finally {
      setIsCreating(false);
      shopify.loading(false);
    }
  };

  return {
    createProducts,
    isCreating,
  };
}

export function useProducts() {
  const productsCount = useProductsCount();
  const createProducts = useCreateProducts();

  return {
    ...productsCount,
    ...createProducts,
  };
}
