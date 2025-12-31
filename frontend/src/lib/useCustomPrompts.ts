import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    listCustomPrompts,
    createCustomPrompt,
    updateCustomPrompt,
    deleteCustomPrompt,
    getSystemDefaultPrompt,
} from "./api";
import type { CustomPrompt } from "./api";
import { toast } from "sonner";

export function useSystemDefaultPrompt() {
    return useQuery({
        queryKey: ["system-default-prompt"],
        queryFn: getSystemDefaultPrompt,
    });
}

export function useCustomPrompts(enabled = true) {
    return useQuery({
        queryKey: ["custom-prompts"],
        queryFn: listCustomPrompts,
        enabled,
    });
}

export function useCreateCustomPrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCustomPrompt,
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["custom-prompts"] });
            toast.success("Prompt saved successfully!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to save prompt");
        },
    });
}

export function useUpdateCustomPrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: Partial<Pick<CustomPrompt, "name" | "prompt_text" | "is_default">>;
        }) => updateCustomPrompt(id, payload),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["custom-prompts"] });
            toast.success("Prompt updated successfully!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update prompt");
        },
    });
}

export function useDeleteCustomPrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteCustomPrompt(id),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["custom-prompts"] });
            toast.success("Prompt deleted successfully!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete prompt");
        },
    });
}
