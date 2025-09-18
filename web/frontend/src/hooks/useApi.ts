import { useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ApiError } from "@/services";

export function useApiErrorHandler() {
  const shopify = useAppBridge();

  const handleError = useCallback(
    (error: Error | ApiError) => {
      console.error("API Error:", error);

      let message = "An unexpected error occurred";

      if (error instanceof ApiError) {
        message = `API Error (${error.status}): ${error.message}`;
      } else if (error.message) {
        message = error.message;
      }

      shopify.toast.show(message, { isError: true });
    },
    [shopify]
  );

  return { handleError };
}

export function useLoadingState() {
  const shopify = useAppBridge();

  const setLoading = useCallback(
    (loading: boolean) => {
      shopify.loading(loading);
    },
    [shopify]
  );

  return { setLoading };
}
