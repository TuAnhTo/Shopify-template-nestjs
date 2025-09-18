import { ProviderProps } from "@/types";
import { PolarisProvider } from "./PolarisProvider";
import { QueryProvider } from "./QueryProvider";

/**
 * Combines all app providers in the correct order
 */
export function AppProviders({ children }: ProviderProps) {
  return (
    <PolarisProvider>
      <QueryProvider>{children}</QueryProvider>
    </PolarisProvider>
  );
}
