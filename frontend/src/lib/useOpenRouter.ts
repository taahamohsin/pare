import { useQuery } from "@tanstack/react-query";
import { getOpenRouterModels } from "./api";

export function useOpenRouterModels(enabled = true) {
  return useQuery({
    queryKey: ['openrouterModels'],
    queryFn: getOpenRouterModels,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 2,
    enabled, // Only fetch if enabled
  });
}
