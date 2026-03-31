import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserApiKeys,
  createApiKey,
  deleteApiKey,
  type UserApiKey
} from "./api";
import { toast } from "sonner";

export function useUserApiKeys() {
  return useQuery({
    queryKey: ['userApiKeys'],
    queryFn: getUserApiKeys,
    retry: false,
    // Only fetch if user is authenticated - will fail gracefully if not
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApiKey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['userApiKeys'] });
      toast.success("API key saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save API key");
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteApiKey(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['userApiKeys'] });
      toast.success("API key deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete API key");
    },
  });
}
