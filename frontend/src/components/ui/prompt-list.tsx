import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import type { CustomPrompt } from "@/lib/api";
import { useMemo } from "react";

interface PromptListProps {
    prompts: CustomPrompt[];
    onSelect?: (prompt: CustomPrompt) => void;
    onEdit: (prompt: CustomPrompt) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    deletingPromptId: string | null;
    isDeleting: boolean;
}

export function PromptList({
    prompts,
    onSelect,
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

    const hasCustomDefault = useMemo(() => {
        const defaultPrompt = prompts.find(prompt => prompt.is_default);
        return defaultPrompt && defaultPrompt.user_id !== null;
    }, [prompts]);


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
                        <div className="flex items-center group-hover:opacity-100 transition-opacity">

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
                            {(hasCustomDefault ? prompt.is_default : prompt.user_id === null) && (
                                <div className="ml-2">
                                    <Badge className="h-5 bg-blue-600 hover:bg-blue-600 text-white px-2 py-0 border-none text-[10px] font-medium transition-colors">
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
