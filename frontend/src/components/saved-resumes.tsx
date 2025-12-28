import { useMemo, useState } from "react";
import { useResumes, useDeleteResume, useUpdateResume, useResume } from "@/lib/useResumes";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, FileText, Upload, Download, Pencil, Save, X } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { Link } from "@tanstack/react-router";
import type { Resume } from "@/lib/api";
import ContentCard from "@/components/ui/content-card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeUploadDialog } from "@/components/ui/resume-upload-dialog";
import { Badge } from "@/components/ui/badge";
import TruncatedTooltip from "./ui/truncated-tooltip";

export default function SavedResumes() {
    const { user, loading: authLoading } = useAuth();
    const { data, isLoading, isFetching, error } = useResumes(undefined, undefined, true);
    const existingFileNames = useMemo(() => new Set(data?.data.map((r) => r.filename)), [data]);
    const deleteMutation = useDeleteResume();
    const updateMutation = useUpdateResume();

    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const { data: fullResume, isLoading: isLoadingFullResume } = useResume(selectedResumeId);

    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [isEditingText, setIsEditingText] = useState(false);
    const [editText, setEditText] = useState("");

    if (authLoading || (isLoading && !data) || deleteMutation.isPending || updateMutation.isPending) {
        return (
            <div className="flex justify-center items-center min-h-full bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-white mr-2" />
                <p className="text-white">{deleteMutation.isPending ? "Deleting..." : "Loading..."}</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-full gap-4 bg-black text-white">
                <p className="text-lg">Please sign in to view saved resumes</p>
                <Link to="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Go to Home
                </Link>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-full bg-black">
                <p className="text-red-500">Failed to load resumes</p>
            </div>
        );
    }

    const resumes = data?.data || [];



    const handleViewResume = (resume: Resume) => {
        setSelectedResumeId(resume.id);
        setEditText(resume.resume_text || "");
        setIsEditingText(false);
    };

    const handleCloseDialog = () => {
        setSelectedResumeId(null);
        setIsEditingText(false);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteConfirmId(id);
    };

    const handleDeleteConfirm = () => {
        if (!deleteConfirmId) return;

        deleteMutation.mutate(deleteConfirmId, {
            onSuccess: () => {
                if (selectedResumeId === deleteConfirmId) {
                    handleCloseDialog();
                }
                setDeleteConfirmId(null);
            },
        });
    };

    const handleSetDefault = (e: React.MouseEvent, id: string, currentlyDefault: boolean) => {
        e.stopPropagation();
        if (currentlyDefault) return;
        updateMutation.mutate({ id, payload: { is_default: true } });
    };

    const handleSaveText = () => {
        if (!fullResume) return;
        updateMutation.mutate({
            id: fullResume.id,
            payload: { resume_text: editText }
        }, {
            onSuccess: () => {
                setIsEditingText(false);
            }
        });
    };

    return (
        <>
            {(deleteMutation.isPending || (deleteMutation.isSuccess && isFetching)) && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xl flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
                        <span className="text-sm text-zinc-600">Deleting...</span>
                    </div>
                </div>
            )}

            <ContentCard className="xl:!max-w-2xl">
                {resumes.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                        <div></div>
                        <h3 className="text-xl sm:text-3xl font-semibold tracking-tight lg:ml-30">Saved Resumes</h3>
                        <Button
                            onClick={() => setIsUploadDialogOpen(true)}
                            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all border border-black bg-black text-white hover:bg-zinc-800 h-10 px-6"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload New
                        </Button>
                    </div>
                )}

                {resumes.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-zinc-300 rounded-xl bg-zinc-50/50">

                        <p className="text-zinc-600 mb-6 font-normal">
                            No saved resumes yet. Upload your first one to get started!
                        </p>
                        <Button
                            onClick={() => setIsUploadDialogOpen(true)}
                            className="bg-black text-white hover:bg-zinc-800"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Resume
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 h-full">
                        {resumes.map((resume) => (
                            <Card
                                key={resume.id}
                                className="border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-all relative overflow-hidden group shadow-sm hover:shadow-md w-full"
                                onClick={() => handleViewResume(resume)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                                                <CardTitle className="text-lg flex-1 min-w-0 max-w-70 truncate block">
                                                    <TruncatedTooltip
                                                        text={resume.original_filename}
                                                        className="text-base font-medium"
                                                        side="top"
                                                    />
                                                </CardTitle>
                                            </div>
                                            <p className="text-xs text-zinc-500">
                                                Added: {new Date(resume.created_at).toLocaleDateString()} • {(resume.file_size / 1024).toFixed(0)} KB
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {!resume.is_default && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => handleSetDefault(e, resume.id, resume.is_default)}
                                                    className="text-xs h-8 px-2 bg-zinc-300"
                                                >
                                                    Set Default
                                                </Button>
                                            )}
                                            {resume.is_default && (
                                                <Badge className="bg-blue-600 flex-shrink-0 h-5 px-1.5 text-[10px] text-white border-0 cursor-default">
                                                    Default
                                                </Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => handleDeleteClick(e, resume.id)}
                                                className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </ContentCard>

            <Dialog open={!!selectedResumeId} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="w-[94vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto pt-10 sm:pt-6 overflow-x-hidden">
                    {!fullResume && isLoadingFullResume ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                        </div>
                    ) : fullResume ? (
                        <>
                            <DialogHeader className="w-full min-w-0 px-0">
                                <div className="flex items-center justify-between gap-4 w-full min-w-0 pt-4">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <FileText className="h-5 w-5 flex-shrink-0 text-zinc-500" />
                                        <DialogTitle className="text-xl font-bold truncate min-w-0 block">
                                            {fullResume.original_filename}
                                        </DialogTitle>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 sm:pr-0">
                                        {fullResume.download_url && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(fullResume.download_url, '_blank')}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleDeleteClick(e, fullResume.id)}
                                            className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="mt-6 space-y-6 w-full min-w-0">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm pb-4 border-b border-zinc-100 w-full min-w-0">
                                    <div>
                                        <p className="text-zinc-500">File Type</p>
                                        <p className="font-medium">{fullResume.file_type.split('/').pop()?.toUpperCase() || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500">File Size</p>
                                        <p className="font-medium">{(fullResume.file_size / 1024).toFixed(0)} KB</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500">Uploaded</p>
                                        <p className="font-medium">{new Date(fullResume.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500">Status</p>
                                        <p className="font-medium"><Badge className={`bg-${fullResume.is_default ? "blue-600" : "zinc-900"} flex-shrink-0 h-5 px-1.5 text-[10px] text-white border-0 cursor-default`}>{fullResume.is_default ? "Default" : "Secondary"}</Badge></p>
                                    </div>
                                </div>

                                <Tabs defaultValue="preview" className="w-full">
                                    <TabsList className="bg-zinc-100 p-1">
                                        <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                                        <TabsTrigger value="text" className="text-xs">Extracted Text</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="preview" className="mt-4 w-full">
                                        <div className="border border-zinc-200 rounded-md bg-zinc-100 overflow-hidden h-[500px] sm:h-[600px] w-full flex items-center justify-center relative shadow-inner">
                                            {fullResume.download_url ? (
                                                fullResume.file_type === 'application/pdf' ? (
                                                    <iframe
                                                        src={`${fullResume.download_url}#toolbar=0`}
                                                        className="w-full h-full border-0 absolute inset-0"
                                                        title="Resume Preview"
                                                    />
                                                ) : (
                                                    <div className="text-center p-6 bg-zinc-50 w-full h-full flex flex-col items-center justify-center">
                                                        <FileText className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                                                        <p className="text-sm text-zinc-600 mb-4 font-medium">
                                                            Quick preview not available for {fullResume.file_type.split('/').pop()?.toUpperCase()} files.
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            className="border-zinc-300"
                                                            onClick={() => window.open(fullResume.download_url, '_blank')}
                                                        >
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download to View
                                                        </Button>
                                                    </div>
                                                )
                                            ) : (
                                                <p className="text-sm text-zinc-500">Preview not available.</p>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="text" className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-semibold">Extracted Text</Label>
                                            {!isEditingText ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsEditingText(true);
                                                        setEditText(fullResume.resume_text || "");
                                                    }}
                                                    className="h-8 px-2 text-xs"
                                                >
                                                    <Pencil className="h-3 w-3 mr-1" />
                                                    Edit Text
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setIsEditingText(false);
                                                            setEditText(fullResume.resume_text || "");
                                                        }}
                                                        className="h-8 px-2 text-xs"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={handleSaveText}
                                                        disabled={updateMutation.isPending}
                                                        className="h-8 px-2 text-xs"
                                                    >
                                                        {updateMutation.isPending ? (
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <Save className="h-3 w-3 mr-1" />
                                                        )}
                                                        Save
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="border border-zinc-200 rounded-md bg-zinc-50 min-h-[400px] overflow-hidden">
                                            {isEditingText ? (
                                                <Textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="min-h-[500px] w-full border-0 focus-visible:ring-0 font-mono text-xs p-4 bg-white resize-none"
                                                    placeholder="Paste or edit resume text here..."
                                                />
                                            ) : (
                                                <div className="p-4 h-[500px] overflow-y-auto">
                                                    <pre className="text-xs text-zinc-800 whitespace-pre-wrap font-mono leading-relaxed">
                                                        {fullResume.resume_text || "No text extracted from this resume."}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog >

            <ResumeUploadDialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
                isAuthenticated={!!user}
                existingFileNames={existingFileNames}
            />

            <AlertDialog open={!!deleteConfirmId} onOpenChange={(open: boolean) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this resume. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
