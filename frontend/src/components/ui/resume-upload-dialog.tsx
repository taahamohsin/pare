import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Info } from "lucide-react";
import { useResumes, useUploadResume } from "@/lib/useResumes";
import { toast } from "sonner";
import type { Resume } from "@/lib/api";

interface ResumeUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUploadSuccess?: (resume: Resume) => void;
    isAuthenticated: boolean;
    existingFileNames: Set<string>;
}

export function ResumeUploadDialog({
    open,
    onOpenChange,
    onUploadSuccess,
    isAuthenticated,
    existingFileNames,
}: ResumeUploadDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [setAsDefault, setSetAsDefault] = useState<boolean>(false);

    const { data: resumesData } = useResumes(undefined, undefined, isAuthenticated);
    const resumes = resumesData?.data || [];
    const hasDefaultResume = useMemo(() => resumes.length > 0 && resumes.some((r) => r.is_default), [resumes]);
    const isForcedDefault = !hasDefaultResume && isAuthenticated;
    const uploadMutation = useUploadResume();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (existingFileNames.has(file.name)) {
            toast.error("File with this name already exists");
            return;
        }

        if (
            file.type !== "application/pdf" &&
            file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            toast.error("Only PDF and DOCX files are supported");
            return;
        }

        if (file.size > 5242880) {
            toast.error("File size must be less than 5 MB");
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            const resume = await uploadMutation.mutateAsync({
                file: selectedFile,
                is_default: setAsDefault || isForcedDefault,
            });

            if (onUploadSuccess) {
                onUploadSuccess(resume);
            }

            setSetAsDefault(false);
            onOpenChange(false);
            setSelectedFile(null);
        } catch (error) {
            // Error handled in mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Upload Resume</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4 max-w-full overflow-x-hidden">
                    <div>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="resume-file">Select File</Label>
                            <span className="bg-amber-400 text-black px-2 py-1 rounded-lg text-xs flex gap-2">
                                <Info className="h-4 w-4 flex" />
                                <span>Files must be either PDF or DOCX and up to 5 MB</span>
                            </span>
                        </div>
                        <input
                            id="resume-file"
                            type="file"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleFileChange}
                            className="mt-2 block w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
                        />



                    </div>
                    {isAuthenticated &&
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="set-default"
                                checked={setAsDefault || isForcedDefault}
                                disabled={isForcedDefault}
                                onChange={(e) => setSetAsDefault(e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                            />

                            <Label htmlFor="set-default" className="text-sm font-normal cursor-pointer">
                                Set as default resume
                            </Label>

                        </div>
                    }
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                setSelectedFile(null);
                            }}
                            disabled={uploadMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
                            {uploadMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Upload
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
