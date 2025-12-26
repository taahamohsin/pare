
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { jsPDF } from "jspdf";
import { Copy, FileDown, Sparkles, Check, Loader2, Save, FileText } from "lucide-react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { toast } from "sonner"
import { saveAs } from "file-saver";

import { classifyGeminiError } from "@/lib/utils";
import { useCreateCoverLetter } from "@/lib/useCoverLetters";
import { useAuth } from "@/lib/useAuth";
import ContentCard from "@/components/ui/content-card";
import { Document, Packer, Paragraph, TextRun } from "docx";
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

// Initialize PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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
    const [copied, setCopied] = useState<boolean>(false);
    const [step, setStep] = useState<string | null>(null);

    const [resumeText, setResumeText] = useState<string>("");
    const [isParsing, setIsParsing] = useState<boolean>(false);
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");

    const createMutation = useCreateCoverLetter();

    const extractTextFromPDF = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += pageText + "\n";
        }
        return fullText;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsParsing(true);
        setStep(PROCESSING_STEPS.PARSE);
        setResumeText("");

        try {
            let text = "";
            if (file.type === "application/pdf") {
                text = await extractTextFromPDF(file);
            } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else {
                toast.error("Unsupported file type. Please upload a PDF or DOCX.");
                setIsParsing(false);
                return;
            }
            setResumeText(text);
        } catch (error) {
            toast.error("Failed to read resume file. Please try again.");
        } finally {
            setIsParsing(false);
            setStep(null);
        }
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
        setFileName("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (step) setStep(null);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPDF = () => {
        if (!coverLetter) return;

        const doc = new jsPDF();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);

        // Split text to fit page
        const splitText = doc.splitTextToSize(coverLetter, 180);

        doc.text(splitText, 15, 20);

        doc.save(`${jobTitle.replace(/\s+/g, "_")}_Cover_Letter.pdf`);
    };

    const handleExportDocx = async () => {
        if (!coverLetter) return;

        // Split cover letter into paragraphs
        const paragraphs = coverLetter.split('\n').filter(line => line.trim() !== '');

        // Create document with paragraphs
        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs.map(paragraphText =>
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: paragraphText,
                                font: "Calibri",
                                size: 24, // 12pt in half-points
                            }),
                        ],
                        spacing: {
                            after: 200, // spacing after paragraph
                        },
                    })
                ),
            }],
        });

        // Generate and download the document
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${jobTitle.replace(/\s+/g, "_")}_Cover_Letter.docx`);
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

        createMutation.mutate(
            {
                template_name: templateName.trim(),
                template_description: templateDescription.trim(),
                cover_letter_content: coverLetter,
                resume_text: resumeText,
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
        <ContentCard footer="Built for software engineers.">
            <div className="space-y-6 w-full">
                <div className="space-y-2">
                    <Label htmlFor="resume">Resume (PDF or DOCX)</Label>
                    <div className="flex items-center space-x-2 w-50">
                        <Input
                            id="resume"
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx"
                            onChange={handleFileUpload}
                            className="cursor-pointer file:cursor-pointer bg-black text-gray-400 file:text-white"
                            disabled={isParsing || generateMutation.isPending}
                        />
                        {isParsing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {resumeText && !isParsing && (
                        <div className="text-xs text-green-600 flex items-center mt-1">
                            <Check className="h-3 w-3 mr-1" /> Resume parsed successfully ({resumeText.length} chars)
                        </div>
                    )}
                    {fileName && !resumeText && !isParsing && (
                        <div className="text-xs text-red-500 flex items-center mt-1">
                            Failed to parse content from {fileName}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                        id="jobTitle"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        disabled={isParsing || generateMutation.isPending}
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
                        disabled={isParsing || generateMutation.isPending}
                    />
                </div>

                <div className="flex justify-center sticky bottom-0 space-x-2 flex-wrap gap-2">
                    <Button
                        className="flex-1 sm:flex-none cursor-pointer min-w-fit h-10"
                        onClick={handleGenerate}
                        disabled={!jobTitle || !jobDescription || generateMutation.isPending || isParsing || fileName.length === 0}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        <span className={step ? "animate-pulse" : ""}>{step ?? "Generate Cover Letter"}</span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={!jobTitle && !jobDescription && !resumeText && !coverLetter}
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopy}
                                    className="cursor-pointer"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-2" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportPDF}
                                    className="cursor-pointer"
                                >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    <span>PDF</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportDocx}
                                    className="cursor-pointer"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    <span>DOCX</span>
                                </Button>
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
