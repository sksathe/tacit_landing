"use client";

import { KnowledgeItem } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Calendar, User, Folder } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface KnowledgeDocumentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: KnowledgeItem | null;
}

export function KnowledgeDocumentModal({
    open,
    onOpenChange,
    item,
}: KnowledgeDocumentModalProps) {
    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] h-[95vh] max-w-none max-h-[95vh] flex flex-col p-0 gap-0 m-0 translate-x-[-50%] translate-y-[-50%]">
                <DialogHeader className="px-8 pt-5 pb-4 flex-shrink-0 border-b border-border/50 bg-sidebar/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-lg font-semibold mb-2">{item.title}</DialogTitle>
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                    <Calendar className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    <span className="text-muted-foreground">{new Date(item.createdDate || item.createdAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                    <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    <span className="text-muted-foreground">{item.agentName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/10 min-w-0">
                                    <Folder className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    <span className="text-muted-foreground truncate">{item.sourceMeetingTitle}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="markdown-content px-12 py-10 max-w-[85%] mx-auto">
                        {item.markdownContent ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {item.markdownContent}
                            </ReactMarkdown>
                        ) : (
                            <div className="text-muted-foreground">
                                <p className="mb-4">{item.contentSnippet}</p>
                                <p className="text-xs italic">No detailed content available for this document.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

