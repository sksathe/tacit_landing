"use client";

import { useState, useEffect } from "react";
import { TacitChrome } from "@/components/layout/TacitChrome";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, FileText, Download, Calendar, Workflow, Bot, Filter, Loader2, Eye } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Document } from "@/types";
import { Hint } from "@/components/ui/hint";

export default function DocumentsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterSource, setFilterSource] = useState<string>("all");
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [markdownContent, setMarkdownContent] = useState<string>("");
    const [isLoadingContent, setIsLoadingContent] = useState(false);

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = 
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.sourceName?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = filterType === "all" || doc.type === filterType;
        const matchesSource = filterSource === "all" || doc.source === filterSource;
        
        return matchesSearch && matchesType && matchesSource;
    });

    const getTypeIcon = (type: Document['type']) => {
        switch (type) {
            case 'pdf':
                return '📕';
            case 'docx':
                return '📘';
            case 'markdown':
                return '📝';
            case 'text':
                return '📄';
            default:
                return '📄';
        }
    };

    const getTypeColor = (type: Document['type']) => {
        switch (type) {
            case 'pdf':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'docx':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'markdown':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'text':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric", 
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    useEffect(() => {
        const fetchDocuments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/documents');
                if (!response.ok) {
                    throw new Error('Failed to fetch documents');
                }
                const supabaseDocs = await response.json();
                // Ensure all Supabase docs have sourceId set to filename
                const normalizedSupabaseDocs = supabaseDocs.map((doc: Document) => ({
                    ...doc,
                    sourceId: doc.sourceId || doc.id || doc.fileUrl?.split('/').pop() || doc.name,
                }));
                // Set only Supabase documents
                setDocuments(normalizedSupabaseDocs);
            } catch (err) {
                console.error('Error fetching documents:', err);
                setError(err instanceof Error ? err.message : 'Failed to load documents');
                // Set empty array on error
                setDocuments([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const handleDownload = async (doc: Document) => {
        if (doc.fileUrl) {
            // If it's a Supabase file, download directly
            window.open(doc.fileUrl, '_blank');
        } else {
            // For mock documents, show alert
            console.log("Downloading document:", doc.id);
            alert(`Downloading ${doc.name}...`);
        }
    };

    const handleViewDocument = async (doc: Document) => {
        if (doc.type !== 'markdown' || !doc.fileUrl) {
            // For non-markdown or files without URLs, just download
            handleDownload(doc);
            return;
        }

        setSelectedDocument(doc);
        setIsLoadingContent(true);
        setMarkdownContent("");

        try {
            // Extract filename from URL or use sourceId
            // For Supabase URLs: https://[project].supabase.co/storage/v1/object/[bucket]/[filename]
            let filename = '';
            
            if (doc.sourceId && doc.sourceId !== 'undefined') {
                // Use sourceId if available (should be the filename for Supabase docs)
                filename = doc.sourceId;
            } else if (doc.fileUrl) {
                // Extract filename from Supabase storage URL
                // URL format: .../storage/v1/object/k_doc/[filename] or .../storage/v1/object/public/k_doc/[filename]
                try {
                    const url = new URL(doc.fileUrl);
                    const pathParts = url.pathname.split('/').filter(part => part);
                    const bucketIndex = pathParts.findIndex(part => part === 'k_doc');
                    if (bucketIndex !== -1 && pathParts[bucketIndex + 1]) {
                        filename = pathParts[bucketIndex + 1];
                        // Remove query parameters if any
                        filename = filename.split('?')[0];
                    } else {
                        // Fallback: try to get the last meaningful part
                        const lastPart = pathParts[pathParts.length - 1];
                        if (lastPart && lastPart !== 'k_doc') {
                            filename = lastPart.split('?')[0];
                        }
                    }
                } catch (e) {
                    // If URL parsing fails, try simple string split
                    const urlParts = doc.fileUrl.split('/');
                    const bucketIndex = urlParts.findIndex(part => part === 'k_doc');
                    if (bucketIndex !== -1 && urlParts[bucketIndex + 1]) {
                        filename = urlParts[bucketIndex + 1].split('?')[0];
                    } else {
                        filename = urlParts[urlParts.length - 1].split('?')[0];
                    }
                }
            }
            
            if (!filename || filename === 'undefined') {
                throw new Error(`Could not determine filename. sourceId: ${doc.sourceId}, fileUrl: ${doc.fileUrl}`);
            }
            
            console.log('Fetching document:', { filename, sourceId: doc.sourceId, fileUrl: doc.fileUrl });
            const response = await fetch(`/api/documents/${encodeURIComponent(filename)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch document content');
            }

            const data = await response.json();
            setMarkdownContent(data.content || '');
        } catch (err) {
            console.error('Error fetching document content:', err);
            setMarkdownContent(`Error loading document content: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoadingContent(false);
        }
    };

    return (
        <TacitChrome>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-white">Documents</h1>
                        <p className="text-white/60">
                            Documents created from meetings and workflows
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                            type="search"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-emerald-500/50"
                        />
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                <Filter className="w-4 h-4 mr-2" />
                                Type: {filterType === "all" ? "All" : filterType.toUpperCase()}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setFilterType("all")}>
                                All Types
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType("pdf")}>
                                PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType("docx")}>
                                DOCX
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType("markdown")}>
                                Markdown
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType("text")}>
                                Text
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                <Filter className="w-4 h-4 mr-2" />
                                Source: {filterSource === "all" ? "All" : filterSource === "meeting" ? "Meetings" : "Workflows"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setFilterSource("all")}>
                                All Sources
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterSource("meeting")}>
                                <Bot className="w-4 h-4 mr-2" /> Meetings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterSource("workflow")}>
                                <Workflow className="w-4 h-4 mr-2" /> Workflows
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Hint variant="tip">
                    Documents are automatically generated from meetings when workflows are assigned. Click "View" to see markdown content, or "Download" to save PDF/DOCX files. Use filters to find documents by type or source.
                </Hint>
            </div>

            {isLoading ? (
                <div className="text-center py-16">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Loading documents...</p>
                </div>
            ) : error ? (
                <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">Error loading documents</h3>
                    <p className="text-white/60 mb-6">{error}</p>
                    <p className="text-sm text-white/40">Showing mock data as fallback</p>
                </div>
            ) : filteredDocuments.length > 0 ? (
                <div className="border border-white/10 rounded-md overflow-hidden bg-[#1a1a1f]">
                    <div className="divide-y divide-white/10">
                        {filteredDocuments.map((doc) => (
                            <div 
                                key={doc.id} 
                                className="group hover:bg-white/5 transition-colors duration-200 p-4"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors truncate mb-2">
                                            {doc.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{formatDate(doc.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        {doc.type === 'markdown' && doc.fileUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDocument(doc)}
                                                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            >
                                                <Eye className="w-4 h-4 mr-2" /> View
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload(doc)}
                                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            <Download className="w-4 h-4 mr-2" /> Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">No documents found</h3>
                    <p className="text-white/60 mb-6">
                        {searchQuery || filterType !== "all" || filterSource !== "all"
                            ? "Try adjusting your search or filters"
                            : "Documents created from meetings and workflows will appear here"}
                    </p>
                </div>
            )}

            {/* Markdown Viewer Dialog */}
            <Dialog open={!!selectedDocument} onOpenChange={() => {
                setSelectedDocument(null);
                setMarkdownContent("");
            }}>
                <DialogContent className="w-[95vw] h-[95vh] max-w-none max-h-[95vh] flex flex-col p-0 gap-0 bg-[#1a1a1f] border-white/10 rounded-md translate-x-[-50%] translate-y-[-50%] overflow-hidden">
                    <DialogHeader className="px-8 pt-6 pb-4 flex-shrink-0 border-b border-white/10 bg-[#1a1a1f]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <DialogTitle className="text-white text-xl">
                                        {selectedDocument?.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-white/60 text-sm mt-1">
                                        {selectedDocument?.description || "Markdown document"}
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full px-8 py-6">
                        {isLoadingContent ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-emerald max-w-none markdown-content">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mb-4 pb-2 border-b border-white/10" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-white mt-6 mb-3" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-white mt-5 mb-2" {...props} />,
                                        p: ({node, ...props}) => <p className="text-white/80 mb-4 leading-relaxed" {...props} />,
                                        code: ({node, inline, ...props}: any) => 
                                            inline ? (
                                                <code className="bg-white/10 text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                                            ) : (
                                                <code className="block bg-white/5 text-white/90 p-4 rounded-md overflow-x-auto text-sm font-mono border border-white/10" {...props} />
                                            ),
                                        pre: ({node, ...props}) => <pre className="bg-white/5 border border-white/10 rounded-md p-4 overflow-x-auto mb-4" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc list-inside text-white/80 mb-4 space-y-2" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal list-inside text-white/80 mb-4 space-y-2" {...props} />,
                                        li: ({node, ...props}) => <li className="text-white/80" {...props} />,
                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500/50 pl-4 py-2 my-4 text-white/70 italic" {...props} />,
                                        a: ({node, ...props}) => <a className="text-emerald-400 hover:text-emerald-300 underline" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                                        table: ({node, ...props}) => <table className="w-full border-collapse mb-4 text-white/80" {...props} />,
                                        th: ({node, ...props}) => <th className="border border-white/10 px-4 py-2 text-left font-semibold text-white bg-white/5" {...props} />,
                                        td: ({node, ...props}) => <td className="border border-white/10 px-4 py-2" {...props} />,
                                    }}
                                >
                                    {markdownContent}
                                </ReactMarkdown>
                            </div>
                        )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </TacitChrome>
    );
}

