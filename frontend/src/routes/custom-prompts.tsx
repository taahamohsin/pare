import { createFileRoute } from "@tanstack/react-router";
import CustomPromptsPage from "@/components/custom-prompts";

export const Route = createFileRoute("/custom-prompts")({
    component: CustomPromptsPage,
});
