import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listCoverLetters,
  createCoverLetter,
  updateCoverLetter,
  deleteCoverLetter,
  type CoverLetter,
} from "./api";

export function useCoverLetters(limit = 10, offset = 0) {
  return useQuery({
    queryKey: ["cover-letters", limit, offset],
    queryFn: () => listCoverLetters(limit, offset)
  });
}

export function useCreateCoverLetter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCoverLetter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cover-letters"] });
      toast.success("Cover letter saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save cover letter");
    },
  });
}

export function useUpdateCoverLetter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<
        Pick<CoverLetter, "template_name" | "template_description" | "cover_letter_content">
      >;
    }) => updateCoverLetter(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cover-letters"] });
      toast.success("Cover letter updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update cover letter");
    },
  });
}

export function useDeleteCoverLetter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCoverLetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cover-letters"] });
      toast.success("Cover letter deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete cover letter");
    },
  });
}
