import { createFileRoute } from "@tanstack/react-router";
import CoverLetterForm from "@/components/cover-letter-form";

export const Route = createFileRoute("/")({
    component: CoverLetterForm,
});
