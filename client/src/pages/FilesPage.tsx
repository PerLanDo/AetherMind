import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  Image,
  File,
  Folder,
  Search,
  Filter,
  MoreVertical,
  Download,
  Trash2,
  Edit,
  Share,
  Plus,
  Grid,
  List as ListIcon,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import FileUploadZone from "@/components/FileUploadZone";
import DocumentAnalyzer from "@/components/DocumentAnalyzer";

interface FileItem {
  id: number;
  name: string;
  type: string;
  size: number;
  project_id?: number;
  uploaded_at: string;
  url?: string;
}

interface Project {
  id: number;
  name: string;
}

export default function FilesPage() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUploader, setShowUploader] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const queryClient = useQueryClient();

  // Get query params
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const showUpload = urlParams.get("action") === "upload";

  // Fetch files
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["/api/files", selectedProject, searchQuery],
    queryFn: async (): Promise<FileItem[]> => {
      const params = new URLSearchParams();
      if (selectedProject)
        params.append("project_id", selectedProject.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/files?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      return response.json();
    },
  });

  // Fetch projects for filtering
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async (): Promise<Project[]> => {
      const response = await fetch("/api/projects", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type === "application/pdf") return FileText;
    if (type.includes("document") || type.includes("word")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileDelete = (fileId: number) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(fileId);
    }
  };

  const handleFileAnalyze = (file: FileItem) => {
    setAnalyzingFile({ id: file.id, name: file.name });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">File Manager</h1>
                <p className="text-muted-foreground">
                  Manage and organize your research documents
                </p>
              </div>
              <Button onClick={() => setShowUploader(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={selectedProject?.toString() || "all"}
                onValueChange={(value) =>
                  setSelectedProject(value === "all" ? null : parseInt(value))
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload Modal */}
          {(showUploader || showUpload) && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-background p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Upload Files</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUploader(false)}
                  >
                    ×
                  </Button>
                </div>
                <FileUploadZone
                  onUploadComplete={() => {
                    setShowUploader(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/files"] });
                  }}
                />
              </div>
            </div>
          )}

          {/* Files Content */}
          <div className="flex-1 p-6">
            {filesLoading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading files...</div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Folder className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium mb-2">No files yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "No files match your search."
                      : "Upload your first file to get started."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setShowUploader(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-2"
                }
              >
                {files.map((file) => {
                  const FileIcon = getFileIcon(file.type);

                  if (viewMode === "grid") {
                    return (
                      <Card
                        key={file.id}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <FileIcon className="h-8 w-8 text-primary" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleFileAnalyze(file)}
                              >
                                <Brain className="mr-2 h-4 w-4" />
                                Analyze with AI
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  file.url && window.open(file.url, "_blank")
                                }
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share className="mr-2 h-4 w-4" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleFileDelete(file.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2">
                          <h3
                            className="font-medium text-sm truncate"
                            title={file.name}
                          >
                            {file.name}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatFileSize(file.size)}</span>
                            <span>
                              {new Date(file.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                          {file.project_id && (
                            <Badge variant="secondary" className="text-xs">
                              {projects.find((p) => p.id === file.project_id)
                                ?.name || "Unknown Project"}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    );
                  } else {
                    return (
                      <Card key={file.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <FileIcon className="h-8 w-8 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">
                              {file.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatFileSize(file.size)}</span>
                              <span>
                                {new Date(
                                  file.uploaded_at
                                ).toLocaleDateString()}
                              </span>
                              {file.project_id && (
                                <Badge variant="secondary" className="text-xs">
                                  {projects.find(
                                    (p) => p.id === file.project_id
                                  )?.name || "Unknown Project"}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleFileAnalyze(file)}
                              >
                                <Brain className="mr-2 h-4 w-4" />
                                Analyze with AI
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  file.url && window.open(file.url, "_blank")
                                }
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share className="mr-2 h-4 w-4" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleFileDelete(file.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Document Analyzer Modal */}
      {analyzingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <DocumentAnalyzer
              fileId={analyzingFile.id.toString()}
              fileName={analyzingFile.name}
              onClose={() => setAnalyzingFile(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
