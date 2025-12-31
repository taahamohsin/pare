import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, FileDown, FileText, Check } from "lucide-react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { toast } from "sonner";

interface CoverLetterActionsProps {
    content: string;
    filename: string;
    className?: string;
}

export default function CoverLetterActions({ content, filename, className = "" }: CoverLetterActionsProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPDF = () => {
        if (!content) return;

        const doc = new jsPDF();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(content, 180);
        doc.text(splitText, 15, 20);
        doc.save(`${filename}_Cover_Letter.pdf`);
        toast.success("PDF downloaded!");
    };

    const handleExportDocx = async () => {
        if (!content) return;

        const paragraphs = content.split('\n').filter(line => line.trim() !== '');
        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs.map(paragraphText =>
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: paragraphText,
                                font: "Calibri",
                                size: 24,
                            }),
                        ],
                        spacing: {
                            after: 200,
                        },
                    })
                ),
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${filename}_Cover_Letter.docx`);
        toast.success("DOCX downloaded!");
    };

    return (
        <div className={`flex gap-2 ${className}`}>
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
        </div>
    );
}