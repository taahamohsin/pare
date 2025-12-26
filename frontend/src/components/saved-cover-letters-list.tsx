import { useCoverLetters } from "@/lib/useCoverLetters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface SavedCoverLettersListProps {
  onClose?: () => void;
}

export default function SavedCoverLettersList({ onClose }: SavedCoverLettersListProps) {
  const { data, isLoading, error } = useCoverLetters(5, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-sm text-red-500">Failed to load cover letters</p>
      </div>
    );
  }

  const coverLetters = data?.data || [];

  return (
    <div className="space-y-3">
      {coverLetters.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-400 text-center">
              No saved cover letters yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {coverLetters.map((letter) => (
            <Card key={letter.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader className="p-4">
                <div className="space-y-2">
                  <CardTitle className="text-sm text-zinc-100 line-clamp-1">
                    {letter.job_title}
                  </CardTitle>
                  <p className="text-xs text-zinc-500">
                    {new Date(letter.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {letter.job_description}
                  </p>
                </div>
              </CardHeader>
            </Card>
          ))}
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={onClose}
          >
            <Link to="/saved">
              View All
              <ExternalLink className="h-3 w-3 ml-2" />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
