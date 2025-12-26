import { createFileRoute } from "@tanstack/react-router";
import SavedCoverLetters from "@/components/saved-cover-letters";

export const Route = createFileRoute("/saved")({
    component: SavedCoverLetters,
});
