
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { jsPDF } from "jspdf";
import { Copy, FileDown, Sparkles, Check, Loader2 } from "lucide-react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { toast } from "sonner"
import { classifyGeminiError } from "@/lib/utils";

// Initialize PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROCESSING_STEPS = {
    'PARSE': 'Parsing resume and matching job requirements...',
    'GENERATE': 'Generating cover letter...',
    'FINISHING': 'Finishing up...'
};

export default function CoverLetterForm() {
    const [jobTitle, setJobTitle] = useState<string>("");
    const [jobDescription, setJobDescription] = useState<string>("");
    const [coverLetter, setCoverLetter] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);
    const [step, setStep] = useState<string | null>(null);

    const [resumeText, setResumeText] = useState<string>("");
    const [isParsing, setIsParsing] = useState<boolean>(false);
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    return (
        <div className="flex justify-center min-h-screen px-4 py-12 bg-black">
            <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-[880px] bg-white rounded-xl shadow-lg p-6 sm:p-8">
                <CardContent className="space-y-6 w-full">
                    <div className="space-y-2 w-100">
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

                    <div className="flex justify-center sticky bottom-0 space-x-2">
                        <Button
                            className="w-50 cursor-pointer min-w-fit h-10"
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
                        <div className="space-y-2 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="output">Generated Cover Letter</Label>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="cursor-pointer"
                                    >
                                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                                        {copied ? "Copied" : "Copy"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportPDF}
                                        className="cursor-pointer"
                                    >
                                        <FileDown className="h-4 w-4 mr-1" /> PDF
                                    </Button>
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
                </CardContent>
                <CardFooter className="justify-center text-sm text-muted-foreground">
                    Built for software engineers.
                </CardFooter>
            </Card>
        </div>
    );
}
