import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { useCustomPrompts, useCreateCustomPrompt, useUpdateCustomPrompt, useDeleteCustomPrompt, useSystemDefaultPrompt } from "@/lib/useCustomPrompts";
import { toast } from "sonner";
import type { CustomPrompt } from "@/lib/api";
import { PromptList } from "./ui/prompt-list";
import { useAuth } from "@/lib/useAuth";
import { Card, CardContent } from "@/components/ui/card";

export default function CustomPromptsPage() {
    const { user } = useAuth();
    const isAuthenticated = !!user;

    const [view, setView] = useState<"list" | "form" | "read">("list");
    const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
    const [name, setName] = useState("");
    const [promptText, setPromptText] = useState("");
    const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);

    const { data: promptsData, isLoading: isLoadingPrompts } = useCustomPrompts(isAuthenticated);
    const prompts = promptsData?.data || [];
    const { data: systemDefaultPrompt } = useSystemDefaultPrompt();

    const createMutation = useCreateCustomPrompt();
    const updateMutation = useUpdateCustomPrompt();
    const deleteMutation = useDeleteCustomPrompt();

    const handleCreateNew = () => {
        setEditingPrompt(null);
        setName("");
        setPromptText(systemDefaultPrompt?.prompt_text || "");
        setView("form");
    };

    const handleEdit = (prompt: CustomPrompt) => {
        if (prompt.user_id === null) return;
        setEditingPrompt(prompt);
        setName(prompt.name);
        setPromptText(prompt.prompt_text);
        setView("form");
    };

    const handleRead = (prompt: CustomPrompt) => {
        setEditingPrompt(prompt);
        setView("read");
    };

    const handleSubmit = async () => {
        if (!name.trim() || !promptText.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            if (editingPrompt) {
                await updateMutation.mutateAsync({
                    id: editingPrompt.id,
                    payload: { name, prompt_text: promptText },
                });
            } else {
                await createMutation.mutateAsync({
                    name,
                    prompt_text: promptText,
                });
            }
            setView("list");
        } catch (error) {
            // Error handled in mutation
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this prompt?")) {
            setDeletingPromptId(id);
            try {
                await deleteMutation.mutateAsync(id);
            } catch (error) {
                // Error handled in mutation
            } finally {
                setDeletingPromptId(null);
            }
        }
    };

    // Use a no-op / redirect for main select, or map it to Read?
    // In the page view, clicking the row should probably open it (Read view).
    const handleSelectPrompt = (prompt: CustomPrompt) => {
        handleRead(prompt);
    };

    return (
        <div className="min-h-[calc(100vh-3rem)] bg-black px-4 py-8 sm:px-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Custom Prompts</h1>
                        <p className="text-zinc-400 mt-2">Manage your personalized cover letter generation instructions.</p>
                    </div>
                    {view !== "list" && (
                        <Button
                            variant="outline"
                            onClick={() => setView("list")}
                            className="text-black hover:bg-zinc-800 border-zinc-700"
                        >
                            Back to List
                        </Button>
                    )}
                </div>

                <Card className="bg-white border-zinc-200 shadow-lg">
                    <CardContent className="p-6">
                        {view === "list" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-zinc-900">Your Prompts</h2>
                                    <Button
                                        onClick={handleCreateNew}
                                        className={`bg-black text-white ${!isAuthenticated && "hover:bg-zinc-800"}`}
                                        disabled={createMutation.isPending || !isAuthenticated}
                                        disabledTooltip="You must be authenticated to create a custom prompt"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create New
                                    </Button>
                                </div>

                                {isLoadingPrompts ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                        <p className="text-zinc-500 text-sm">Loading your prompts...</p>
                                    </div>
                                ) : (
                                    <PromptList
                                        prompts={prompts}
                                        onSelect={handleSelectPrompt}
                                        onRead={handleRead}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        deletingPromptId={deletingPromptId}
                                        isDeleting={deleteMutation.isPending}
                                    />
                                )}
                            </div>
                        )}

                        {view === "read" && editingPrompt && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-zinc-900">{editingPrompt.name}</h3>
                                    {editingPrompt.user_id !== null && (
                                        <Button
                                            onClick={() => handleEdit(editingPrompt)}
                                            className="bg-black text-white hover:bg-zinc-800"
                                        >
                                            Edit Prompt
                                        </Button>
                                    )}
                                </div>
                                <div className="bg-zinc-50 border border-zinc-200 rounded-md p-6 overflow-y-auto max-h-[60vh]">
                                    <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap italic">
                                        "{editingPrompt.prompt_text}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {view === "form" && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="prompt-name" className="text-zinc-700 text-xs uppercase tracking-wider font-semibold">
                                        Prompt Name
                                    </Label>
                                    <Input
                                        id="prompt-name"
                                        placeholder="e.g. Minimalist Professional"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-white border-zinc-200 h-10 text-zinc-900"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="prompt-text" className="text-zinc-700 text-xs uppercase tracking-wider font-semibold flex justify-between items-center">
                                        <span>Prompt Instructions</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] text-zinc-500"
                                            onClick={() => setPromptText(systemDefaultPrompt?.prompt_text || "")}
                                            disabled={!systemDefaultPrompt}
                                        >
                                            Reset to Default
                                        </Button>
                                    </Label>
                                    <Textarea
                                        id="prompt-text"
                                        placeholder="You are a {jobTitle}..."
                                        value={promptText}
                                        onChange={(e) => setPromptText(e.target.value)}
                                        className="min-h-[400px] bg-white border-zinc-200 resize-none leading-relaxed text-sm font-mono text-zinc-900"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setView("list")}
                                        className="text-zinc-600 hover:text-zinc-900"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="bg-black text-white hover:bg-zinc-800"
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Save Prompt
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
