
import { useMemo, useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Save, MessageSquareText, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { generateCoverLetter as apiGenerateCoverLetter, analyzeJobDescription } from "@/lib/api";
import type { CustomPrompt, JDAnalysis } from "@/lib/api";
import { useCreateCoverLetter } from "@/lib/useCoverLetters";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSystemDefaultPrompt } from "@/lib/useCustomPrompts";
import { useUserApiKeys } from "@/lib/useApiKeys";
import { useOpenRouterModels } from "@/lib/useOpenRouter";
import ContentCard from "@/components/ui/content-card";
import CoverLetterActions from "@/components/ui/cover-letter-actions";
import ResumeSelector from "@/components/ui/resume-selector";
import { CustomPromptDialog } from "@/components/ui/custom-prompt-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const PROCESSING_STEPS = {
    'ANALYZING': 'Analyzing job description with AI...',
    'GENERATING': 'Generating tailored cover letter...',
    'FINISHING': 'Finishing up...'
};

export default function CoverLetterForm() {
    const { user } = useAuthContext();
    const [jobTitle, setJobTitle] = useState<string>("");
    const [jobDescription, setJobDescription] = useState<string>("");
    const [coverLetter, setCoverLetter] = useState<string>("");
    const [step, setStep] = useState<string | null>(null);

    const [resumeText, setResumeText] = useState<string>("");
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [resumeFileName, setResumeFileName] = useState<string>("");

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showCustomPromptDialog, setShowCustomPromptDialog] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");
    const [promptOverride, setPromptOverride] = useState<string | undefined>(undefined);
    const [selectedPrompt, setSelectedPrompt] = useState<CustomPrompt | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openrouter'>('gemini');
    const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);

    // Track if we've initialized the provider based on API keys
    const hasInitializedProvider = useRef(false);

    const applicantName = useMemo(() => {
        return user?.user_metadata?.full_name || user?.identities?.[0]?.identity_data?.full_name || "Applicant";
    }, [user]);

    const MIN_JD_LENGTH = 50;

    const createMutation = useCreateCoverLetter();
    const { data: systemDefaultPrompt } = useSystemDefaultPrompt();
    const { data: apiKeysData } = useUserApiKeys();

    const hasOpenRouterKey = apiKeysData?.data?.some(k => k.provider === 'openrouter' && k.is_active);

    // Only fetch OpenRouter models if user has an API key
    const { data: modelsData } = useOpenRouterModels(hasOpenRouterKey);
    const models = modelsData?.data || [];

    useEffect(() => {
        if (systemDefaultPrompt && !selectedPrompt) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedPrompt(systemDefaultPrompt);
        }
    }, [systemDefaultPrompt, selectedPrompt]);

    // Auto-select OpenRouter provider if user has an API key (only on first load)
    useEffect(() => {
        if (hasOpenRouterKey && !hasInitializedProvider.current) {
            hasInitializedProvider.current = true;
            // This is a one-time initialization when API keys data first loads
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedProvider('openrouter');
        }
    }, [hasOpenRouterKey]);

    const handleResumeSelected = (text: string, id: string, filename: string) => {
        setResumeText(text);
        setSelectedResumeId(id);
        setResumeFileName(filename);
    };


    const generateMutation = useMutation({
        mutationFn: async (data: { jobTitle: string; jobDescription: string; resumeText: string; promptOverride?: string; model?: string }) => {
            let jdAnalysis: JDAnalysis | undefined;

            // Only run JD analysis for premium tier (OpenRouter) users
            // Free tier (Gemma) users skip analysis to avoid using GEMINI_API_KEY
            if (selectedProvider === 'openrouter') {
                setStep(PROCESSING_STEPS.ANALYZING);
                jdAnalysis = await analyzeJobDescription(data.jobDescription);
            }

            // Generate cover letter (with or without analysis depending on tier)
            setStep(PROCESSING_STEPS.GENERATING);
            return apiGenerateCoverLetter({
                ...data,
                jdAnalysis
            });
        },
        onSuccess: (data) => {
            setCoverLetter(data);
            setStep(null);
            toast.success("Cover letter generated successfully!")
        },
        onError: (error: Error) => {
            setStep(null);
            toast.error(error.message || "Failed to generate cover letter. Please try again.")
        }
    });

    const isFormReady: boolean = useMemo(() => {
        return !!jobTitle &&
            !!jobDescription &&
            jobDescription.trim().length >= MIN_JD_LENGTH &&
            !!selectedResumeId &&
            !generateMutation.isPending;
    }, [jobTitle, jobDescription, selectedResumeId, generateMutation.isPending]);

    const handleGenerate = () => {
        setCoverLetter("");
        setStep(PROCESSING_STEPS.ANALYZING);
        generateMutation.mutate({
            jobTitle,
            jobDescription,
            resumeText,
            promptOverride,
            // Only pass model if user explicitly selected OpenRouter provider
            model: selectedProvider === 'openrouter' ? selectedModel : undefined
        });
    };

    const handleReset = () => {
        setJobTitle("");
        setJobDescription("");
        setCoverLetter("");
        setResumeText("");
        setSelectedResumeId(null);
        setResumeFileName("");
        setPromptOverride(undefined);
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
                    <div className="flex justify-between items-center text-xs">
                        <p className={`${jobDescription.trim().length < 50 && jobDescription.length > 0
                            ? 'text-amber-600 font-medium'
                            : 'text-muted-foreground'
                            }`}>
                            {jobDescription.trim().length < 50 && jobDescription.length > 0
                                ? `Add ${50 - jobDescription.trim().length} more characters for AI analysis`
                                : `${jobDescription.trim().length} characters`}
                        </p>

                    </div>
                </div>
                <div className="flex flex-col gap-1.5 w-75">
                    <Label htmlFor="customPrompt" className="mb-1">Prompt</Label>
                    <Button
                        id="customPrompt"
                        variant="outline"
                        onClick={() => setShowCustomPromptDialog(true)}
                        disabled={generateMutation.isPending}
                        className="w-full sm:w-auto cursor-pointer h-10 min-w-[170px] justify-between group  hover:border-slate-400 hover:bg-slate-50"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <MessageSquareText className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-slate-700" />
                            <div className="flex flex-col items-start text-xs text-left overflow-hidden">
                                <span className="font-medium text-zinc-800 text-sm truncate max-w-full">
                                    {selectedPrompt?.name || (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading...
                                        </div>
                                    )}
                                </span>
                            </div>
                        </div>
                        <ChevronDown className="h-3 w-3 text-slate-400 ml-2 shrink-0" />
                    </Button>
                </div>

                <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">AI Provider</Label>
                        <RadioGroup
                            value={selectedProvider}
                            onValueChange={(value) => {
                                setSelectedProvider(value as 'gemini' | 'openrouter');
                                if (value === 'gemini') {
                                    setSelectedModel(undefined);
                                }
                            }}
                            disabled={generateMutation.isPending}
                            className="space-y-3"
                        >
                            <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="gemini" id="provider-gemini" className="mt-1" />
                                <Label
                                    htmlFor="provider-gemini"
                                    className="font-normal cursor-pointer flex-1"
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Free (Gemma)</span>
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                                                No cost
                                            </span>
                                        </div>
                                        <span className="text-sm text-muted-foreground mt-1">
                                            Gemma 3 12B • No API key required
                                        </span>
                                    </div>
                                </Label>
                            </div>

                            {hasOpenRouterKey && (
                                <div className="flex items-start space-x-3 space-y-0">
                                    <RadioGroupItem value="openrouter" id="provider-openrouter" className="mt-1" />
                                    <Label
                                        htmlFor="provider-openrouter"
                                        className="font-normal cursor-pointer flex-1"
                                    >
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Premium (OpenRouter)</span>
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                                    Your API key
                                                </span>
                                            </div>
                                            <span className="text-sm text-muted-foreground mt-1">
                                                Analysis: Gemini Flash • Generation: Claude, GPT-4, etc.
                                            </span>
                                        </div>
                                    </Label>
                                </div>
                            )}
                        </RadioGroup>

                        {!hasOpenRouterKey && (
                            <p className="text-xs text-muted-foreground mt-2 pl-7">
                                Want premium models?{" "}
                                <a href="/profile" className="text-blue-600 hover:underline font-medium">
                                    Add your OpenRouter API key
                                </a>
                            </p>
                        )}
                    </div>

                    {selectedProvider === 'openrouter' && hasOpenRouterKey && (
                        <div className="space-y-2 pl-7 pt-2 border-t border-slate-200">
                            <Label htmlFor="model" className="text-sm font-medium">Select Model</Label>
                            <Select
                                value={selectedModel}
                                onValueChange={setSelectedModel}
                                disabled={generateMutation.isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Claude 3.5 Sonnet (default)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            <div className="flex flex-col">
                                                <span>{model.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ~${(parseFloat(model.pricing.prompt) * 1000).toFixed(3)}/1K tokens
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <div className="flex justify-center sticky bottom-0 space-x-2 flex-wrap gap-2">
                    <Button
                        className="flex-1 sm:flex-none cursor-pointer min-w-fit h-10"
                        onClick={handleGenerate}
                        disabled={!isFormReady}
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
                                    applicantName={applicantName}
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

            <CustomPromptDialog
                open={showCustomPromptDialog}
                onOpenChange={setShowCustomPromptDialog}
                onSelectPrompt={(p) => {
                    setPromptOverride(p.prompt_text);
                    setSelectedPrompt(p);
                    setShowCustomPromptDialog(false);
                }}
                isAuthenticated={!!user}
            />
        </ContentCard >
    );
}
