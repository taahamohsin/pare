import { useState, useRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

function TruncatedTooltip({ text, className, side = "top" }: { text: string; className?: string; side?: "top" | "bottom" | "left" | "right" }) {
    const [isOpen, setIsOpen] = useState(false);
    const textRef = useRef<HTMLSpanElement>(null);

    const handleOpenChange = (open: boolean) => {
        if (open) {
            // Only open if the text is actually truncated
            if (textRef.current && textRef.current.scrollWidth > textRef.current.clientWidth) {
                setIsOpen(true);
            }
        } else {
            setIsOpen(false);
        }
    };

    return (
        <TooltipPrimitive.Provider delayDuration={100}>
            <TooltipPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
                <TooltipPrimitive.Trigger asChild>
                    <span
                        ref={textRef}
                        className={cn("truncate block w-full", className)}
                    >
                        {text}
                    </span>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        sideOffset={8}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-100 p-2.5 rounded-lg shadow-2xl max-w-[320px] break-all z-[100] animate-in fade-in-0 zoom-in-95 pointer-events-none"
                    >
                        <p className="font-medium text-xs leading-relaxed text-center">{text}</p>
                        <TooltipPrimitive.Arrow className="fill-zinc-900" />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}

export default TruncatedTooltip;
