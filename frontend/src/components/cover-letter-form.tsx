
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { classifyGeminiError } from "@/lib/utils";
import { useCreateCoverLetter } from "@/lib/useCoverLetters";
import { useAuth } from "@/lib/useAuth";
import ContentCard from "@/components/ui/content-card";
import CoverLetterActions from "@/components/ui/cover-letter-actions";
import ResumeSelector from "@/components/ui/resume-selector";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const PROCESSING_STEPS = {
    'PARSE': 'Parsing resume and matching job requirements...',
    'GENERATE': 'Generating cover letter...',
    'FINISHING': 'Finishing up...'
};

export default function CoverLetterForm() {
    const { user } = useAuth();
    const [jobTitle, setJobTitle] = useState<string>("");
    const [jobDescription, setJobDescription] = useState<string>("");
    const [coverLetter, setCoverLetter] = useState<string>("");
    const [step, setStep] = useState<string | null>(null);

    const [resumeText, setResumeText] = useState<string>("");
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [resumeFileName, setResumeFileName] = useState<string>("");

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");

    const createMutation = useCreateCoverLetter();

    const handleResumeSelected = (text: string, id: string, filename: string) => {
        setResumeText(text);
        setSelectedResumeId(id);
        setResumeFileName(filename);
    };

    const generateMutation = useMutation({
        mutationFn: async (data: { jobTitle: string; jobDescription: string; resumeText: string }) => {
            const response = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorCategory = classifyGeminiError(response.body);
                if (errorCategory === "rate_limit") {
                    throw new Error("Rate limit exceeded. Please try again later.");
                } else {
                    throw new Error("Failed to generate cover letter. Please try again.");
                }
            }

            return response.text();
        },
        onSuccess: (data) => {
            setCoverLetter(data!);
            setStep(null);
            toast.success("Cover letter generated successfully!")
        },
        onError: (error: Error) => {
            setStep(null);
            toast.error(error.message || "Failed to generate cover letter. Please try again.")
        }
    });

    const handleGenerate = () => {
        setCoverLetter("");
        setStep(PROCESSING_STEPS.GENERATE);
        setTimeout(() => {
            setStep(prev => prev === PROCESSING_STEPS.GENERATE ? PROCESSING_STEPS.FINISHING : prev);
        }, 2000);
        generateMutation.mutate({
            jobTitle,
            jobDescription,
            resumeText
        });
    };

    const handleReset = () => {
        setJobTitle("");
        setJobDescription("");
        setCoverLetter("");
        setResumeText("");
        setSelectedResumeId(null);
        setResumeFileName("");
        if (step) setStep(null);
    };

    const handleSaveClick = () => {
        if (!user) {
            toast.error("Please sign in to save cover letters");
            return;
        }
        setShowSaveDialog(true);
    };

    const handleSaveConfirm = () => {
        if (!templateName.trim()) {
            toast.error("Please enter a template name");
            return;
        }

        if (!selectedResumeId) {
            toast.error("No resume selected");
            return;
        }

        createMutation.mutate(
            {
                template_name: templateName.trim(),
                template_description: templateDescription.trim(),
                cover_letter_content: coverLetter,
                resume_id: selectedResumeId,
            },
            {
                onSuccess: () => {
                    setShowSaveDialog(false);
                    setTemplateName("");
                    setTemplateDescription("");
                },
            }
        );
    };

    const handleSaveCancel = () => {
        setShowSaveDialog(false);
        setTemplateName("");
        setTemplateDescription("");
    };

    return (
        <ContentCard>
            <div className="space-y-6 w-full">
                <ResumeSelector
                    onResumeSelected={handleResumeSelected}
                    selectedResumeId={selectedResumeId || undefined}
                    selectedFileName={resumeFileName}
                    setResumeFileName={setResumeFileName}
                    className="w-75"
                />
                <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                        id="jobTitle"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        disabled={generateMutation.isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="jobDescription">Job Description/Key Requirements</Label>
                    <Textarea
                        id="jobDescription"
                        placeholder="Paste the job requirements here..."
                        className="min-h-[120px]"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        disabled={generateMutation.isPending}
                    />
                </div>
                <div className="flex justify-center sticky bottom-0 space-x-2 flex-wrap gap-2">
                    <Button
                        className="flex-1 sm:flex-none cursor-pointer min-w-fit h-10"
                        onClick={handleGenerate}
                        disabled={!jobTitle || !jobDescription || !resumeText || !selectedResumeId || generateMutation.isPending}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        <span className={step ? "animate-pulse" : ""}>{step ?? "Generate Cover Letter"}</span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={(!jobTitle && !jobDescription && !resumeText && !coverLetter) || generateMutation.isPending}
                        className="cursor-pointer h-10 border-slate-600 text-slate-800 font-medium hover:bg-slate-100 disabled:opacity-50"
                    >
                        Reset
                    </Button>
                </div>

                {coverLetter && (
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="output" className="text-base font-semibold">Generated Cover Letter</Label>
                            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                                <CoverLetterActions
                                    content={coverLetter}
                                    filename={jobTitle.replace(/\s+/g, "_")}
                                    className="contents"
                                />
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="col-span-2 sm:col-span-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleSaveClick}
                                                    disabled={!user || createMutation.isPending}
                                                    className="cursor-pointer w-full"
                                                >
                                                    {createMutation.isPending ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4 mr-2" />
                                                    )}
                                                    <span>Save Template</span>
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        {!user && (
                                            <TooltipContent>
                                                <p>Sign in to save templates</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                        <Textarea
                            id="output"
                            className="min-h-[300px] font-mono text-sm leading-relaxed"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <Dialog open={showSaveDialog} onOpenChange={(open) => !open && handleSaveCancel()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save as Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="templateName">Template Name *</Label>
                            <Input
                                id="templateName"
                                placeholder="e.g. Senior Frontend Position"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && templateName.trim()) {
                                        handleSaveConfirm();
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="templateDescription">Description (optional)</Label>
                            <Textarea
                                id="templateDescription"
                                placeholder="Add notes about this template..."
                                value={templateDescription}
                                onChange={(e) => setTemplateDescription(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveCancel}
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveConfirm}
                            disabled={createMutation.isPending || !templateName.trim()}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Template
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ContentCard>
    );
}
