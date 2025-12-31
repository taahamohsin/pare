import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { useCustomPrompts, useCreateCustomPrompt, useUpdateCustomPrompt, useDeleteCustomPrompt, useSystemDefaultPrompt } from "@/lib/useCustomPrompts";
import { toast } from "sonner";
import type { CustomPrompt } from "@/lib/api";
import { PromptList } from "./prompt-list";

interface CustomPromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectPrompt: (prompt: CustomPrompt) => void;
    isAuthenticated: boolean;
}

export function CustomPromptDialog({
    open,
    onOpenChange,
    onSelectPrompt,
    isAuthenticated,
}: CustomPromptDialogProps) {
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
        if (!prompt.user_id) return; // Cannot edit system prompts
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

    return (
        <Dialog open={open} onOpenChange={(o) => {
            onOpenChange(o);
            if (!o) setView("list");
        }}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className={`p-6 pb-0 ${view === "read" ? "pt-0" : "pt-6"}`}>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        {view === "list" ? "Custom Prompts" : view === "read" ? "" : editingPrompt ? "Edit Prompt" : "New Prompt"}
                    </DialogTitle>
                    <DialogDescription>
                        {view === "list"
                            ? "Select or manage your custom system prompts."
                            : view === "read"
                                ? ""
                                : "Design your custom prompt instructions."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-0">
                    {!isAuthenticated ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <AlertCircle className="h-12 w-12 text-amber-500 opacity-50" />
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Authentication Required</h3>
                                <p className="text-zinc-500 max-w-xs">
                                    Please sign in to save and manage custom prompts across your devices.
                                </p>
                            </div>
                        </div>
                    ) : view === "list" ? (
                        <div className="space-y-4">
                            <Button
                                onClick={handleCreateNew}
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all border border-black bg-black text-white hover:bg-zinc-800 h-10 px-6"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create New Prompt
                            </Button>

                            {isLoadingPrompts ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    <p className="text-zinc-500 text-sm">Loading your prompts...</p>
                                </div>
                            ) : (
                                <PromptList
                                    prompts={prompts}
                                    onSelect={onSelectPrompt}
                                    onRead={handleRead}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    deletingPromptId={deletingPromptId}
                                    isDeleting={deleteMutation.isPending}
                                />
                            )}
                        </div>
                    ) : view === "read" ? (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-zinc-900">{editingPrompt?.name}</h3>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-md p-6 overflow-y-auto">
                                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap italic">
                                    "{editingPrompt?.prompt_text}"
                                </p>
                            </div>
                        </div>
                    ) : (
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
                                    className="bg-white border-zinc-200 h-10"
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
                                    placeholder="You are a {jobTitle}... Align signals with {jobDescription} based on {resumeText}..."
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    className="min-h-[250px] bg-white border-zinc-200 resize-none leading-relaxed text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 pt-0 flex justify-end gap-3 mt-4">
                    {view === "read" ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setView("list")}
                            >
                                Back
                            </Button>
                            {
                                (editingPrompt?.user_id !== null) && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleEdit(editingPrompt!)}
                                        className="bg-black text-white hover:bg-zinc-800"
                                    >
                                        Edit Prompt
                                    </Button>
                                )
                            }
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setView("list")}
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
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
