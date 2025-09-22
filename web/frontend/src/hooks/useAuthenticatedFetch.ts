import { useAppBridge } from "@shopify/app-bridge-react";
import { AppBridgeState, ClientApplication } from "@shopify/app-bridge/client";
import { getSessionToken } from "@shopify/app-bridge/utilities";
import { useCallback } from "react";

/**
 * Hook for making authenticated requests with session tokens
 * Follows Shopify's embedded app authorization guidelines
 */
export function useAuthenticatedFetch() {
  const app = useAppBridge();

  const authenticatedFetch = useCallback(
    async (uri: string, options: RequestInit = {}) => {
      try {
        // Get fresh session token (they expire every minute)
        const sessionToken = await getSessionToken(
          app as unknown as ClientApplication<AppBridgeState>
        );

        // Merge authentication headers with existing options
        const authenticatedOptions: RequestInit = {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
            ...options.headers,
          },
        };

        return fetch(uri, authenticatedOptions);
      } catch (error) {
        console.error("Authentication error:", error);

        // If session token fails, redirect to bounce page for re-authentication
        if (
          error instanceof Error &&
          error.message.includes("FAILED_AUTHENTICATION")
        ) {
          window.location.href = `/exitiframe?shop=${encodeURIComponent(
            new URLSearchParams(location.search).get("shop") || ""
          )}`;
        }

        throw error;
      }
    },
    [app]
  );

  return { authenticatedFetch };
}
