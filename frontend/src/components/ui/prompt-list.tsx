import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Pencil, Trash2 } from "lucide-react";
import type { CustomPrompt } from "@/lib/api";

interface PromptListProps {
    prompts: CustomPrompt[];
    onSelect?: (prompt: CustomPrompt) => void;
    onRead: (prompt: CustomPrompt) => void;
    onEdit: (prompt: CustomPrompt) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    deletingPromptId: string | null;
    isDeleting: boolean;
}

export function PromptList({
    prompts,
    onSelect,
    onRead,
    onEdit,
    onDelete,
    deletingPromptId,
    isDeleting,
}: PromptListProps) {
    if (prompts.length === 0) {
        return (
            <div className="py-12 text-center text-zinc-500 italic">
                No custom prompts yet. The default system prompt will be used.
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {prompts.map((prompt) => (
                <div
                    key={prompt.id}
                    onClick={() => onSelect?.(prompt)}
                    className={`group relative flex flex-col p-3 bg-zinc-50 border border-zinc-200 rounded-md hover:bg-zinc-100 transition-all duration-200 ${onSelect ? 'cursor-pointer' : ''}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-zinc-900 transition-colors truncate">
                            {prompt.name}
                        </h4>
                        <div className="flex items-center gap-1 group-hover:opacity-100 transition-opacity ml-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRead(prompt);
                                }}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            {
                                prompt.user_id !== null && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-zinc-400"
                                            onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-zinc-400 hover:text-red-400"
                                            onClick={(e) => onDelete(prompt.id, e)}
                                            disabled={isDeleting && deletingPromptId === prompt.id}
                                        >
                                            {isDeleting && deletingPromptId === prompt.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </>
                                )}
                            {prompt.is_default && (
                                <div className="top-2 right-2">
                                    <Badge className="h-4 bg-blue-500 text-white px-2 py-0 border-none">
                                        Default
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 italic line-clamp-2">
                        "{prompt.prompt_text}"
                    </p>

                </div>
            ))}
        </div>
    );
}
