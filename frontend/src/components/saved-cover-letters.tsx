import { useState } from "react";
import { useCoverLetters, useUpdateCoverLetter, useDeleteCoverLetter } from "@/lib/useCoverLetters";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { Link } from "@tanstack/react-router";
import type { CoverLetter } from "@/lib/api";
import ContentCard from "@/components/ui/content-card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SavedCoverLetters() {
    const { user, loading: authLoading } = useAuth();
    const { data, isLoading, isFetching, error } = useCoverLetters();
    const updateMutation = useUpdateCoverLetter();
    const deleteMutation = useDeleteCoverLetter();
    const [selectedLetter, setSelectedLetter] = useState<CoverLetter | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editContent, setEditContent] = useState("");
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    if (authLoading || (isLoading && !data)) {
        return (
            <div className="flex justify-center items-center min-h-full bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-full gap-4 bg-black text-white">
                <p className="text-lg">Please sign in to view saved cover letters</p>
                <Link to="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Go to Home
                </Link>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-full bg-black">
                <p className="text-red-500">Failed to load cover letters</p>
            </div>
        );
    }

    const coverLetters = data?.data || [];

    const handleViewLetter = (letter: CoverLetter) => {
        setSelectedLetter(letter);
        setEditingId(null);
        setShowFullDescription(false);
    };

    const handleCloseDialog = () => {
        setSelectedLetter(null);
        setEditingId(null);
        setShowFullDescription(false);
    };

    const handleEdit = (letter: CoverLetter) => {
        setEditingId(letter.id);
        setEditName(letter.template_name);
        setEditDescription(letter.template_description);
        setEditContent(letter.cover_letter_content);
    };

    const handleSaveEdit = (id: string) => {
        updateMutation.mutate(
            {
                id,
                payload: {
                    template_name: editName,
                    template_description: editDescription,
                    cover_letter_content: editContent
                },
            },
            {
                onSuccess: () => {
                    setEditingId(null);
                    if (selectedLetter && selectedLetter.id === id) {
                        setSelectedLetter({
                            ...selectedLetter,
                            template_name: editName,
                            template_description: editDescription,
                            cover_letter_content: editContent
                        });
                    }
                },
            }
        );
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditDescription("");
        setEditContent("");
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteConfirmId(id);
    };

    const handleDeleteConfirm = () => {
        if (!deleteConfirmId) return;

        deleteMutation.mutate(deleteConfirmId, {
            onSuccess: () => {
                if (selectedLetter?.id === deleteConfirmId) {
                    handleCloseDialog();
                }
                setDeleteConfirmId(null);
            },
        });
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmId(null);
    };

    const truncateDescription = (text: string, maxLength: number = 150) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "...";
    };

    return (
        <>
            {(deleteMutation.isPending || (deleteMutation.isSuccess && isFetching)) && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xl flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
                        <span className="text-sm text-zinc-600">Deleting...</span>
                    </div>
                </div>
            )}

            <ContentCard footer="Built for software engineers.">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">Saved Cover Letters</h1>
                    <Link to="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-black bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                        + New
                    </Link>
                </div>

                {coverLetters.length === 0 ? (
                    <div className="p-6 text-center border border-zinc-200 rounded-lg bg-zinc-50">
                        <p className="text-zinc-600">
                            No saved cover letters yet. Generate and save one to get started!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {coverLetters.map((letter) => (
                            <Card
                                key={letter.id}
                                className="border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors"
                                onClick={() => handleViewLetter(letter)}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg sm:text-xl truncate">
                                                {letter.template_name}
                                            </CardTitle>
                                            <p className="text-sm text-zinc-600 mt-1">
                                                Created: {new Date(letter.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                                                {letter.template_description}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleDeleteClick(e, letter.id)}
                                            disabled={deleteMutation.isPending}
                                            className="shrink-0 h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </ContentCard>

            <Dialog open={!!selectedLetter} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto pt-10">
                    {selectedLetter && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 flex flex-col items-center text-center">
                                        <DialogTitle className="text-xl font-bold">
                                            {selectedLetter.template_name}
                                        </DialogTitle>
                                        <p className="text-sm text-zinc-600 mt-1">
                                            Created: {new Date(selectedLetter.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {editingId !== selectedLetter.id && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(selectedLetter)}
                                            className="shrink-0"
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                {editingId === selectedLetter.id ? (
                                    <>
                                        <div>
                                            <Label htmlFor="editName" className="text-sm font-semibold">Template Name</Label>
                                            <Input
                                                id="editName"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="editDescription" className="text-sm font-semibold">Template Description</Label>
                                            <Textarea
                                                id="editDescription"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                className="mt-2 min-h-[100px]"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="editContent" className="text-sm font-semibold">Cover Letter</Label>
                                            <Textarea
                                                id="editContent"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="mt-2 min-h-[300px] font-mono text-sm"
                                            />
                                        </div>

                                        <div className="flex gap-2 justify-end sticky bottom-0 left-0 right-0 opacity-100">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCancelEdit}
                                                disabled={updateMutation.isPending}
                                                className="bg-zinc-100 hover:bg-zinc-300"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setDeleteConfirmId(selectedLetter.id)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete Template
                                            </Button>

                                            <Button
                                                size="sm"
                                                onClick={() => handleSaveEdit(selectedLetter.id)}
                                                disabled={updateMutation.isPending}
                                            >
                                                {updateMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-1" />
                                                )}
                                                Save Changes
                                            </Button>

                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <Label className="text-sm font-semibold">Template Description</Label>
                                            <div className="mt-2 border border-zinc-200 rounded-md p-3 bg-zinc-50">
                                                <p className="text-sm text-zinc-800 whitespace-pre-wrap">
                                                    {showFullDescription
                                                        ? selectedLetter.template_description
                                                        : truncateDescription(selectedLetter.template_description)}
                                                </p>
                                                {selectedLetter.template_description.length > 150 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowFullDescription(!showFullDescription)}
                                                        className="mt-2 h-auto p-0 text-xs text-blue-600 hover:text-blue-800 hover:bg-transparent"
                                                    >
                                                        {showFullDescription ? (
                                                            <>
                                                                <ChevronUp className="h-3 w-3 mr-1" />
                                                                See less
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="h-3 w-3 mr-1" />
                                                                See more
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold">Cover Letter</Label>
                                            <div className="mt-2 border border-zinc-200 rounded-md p-4 bg-zinc-50">
                                                <p className="text-sm text-zinc-800 whitespace-pre-wrap font-mono leading-relaxed">
                                                    {selectedLetter.cover_letter_content}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog >

            <AlertDialog open={!!deleteConfirmId} onOpenChange={(open: boolean) => !open && handleDeleteCancel()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this cover letter template. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
