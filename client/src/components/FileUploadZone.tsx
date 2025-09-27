import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Trash2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

interface FileUploadZoneProps {
  onUploadComplete?: () => void;
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
}

export default function FileUploadZone({
  onUploadComplete,
  projectId,
}: FileUploadZoneProps) {
  const decodeBase64 = useCallback((value: string) => {
    if (typeof globalThis.atob === "function") {
      return globalThis.atob(value);
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(value, "base64").toString("binary");
    }
    throw new Error("Base64 decoding is not supported in this environment");
  }, []);

  const queryClient = useQueryClient();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || "");

  // Fetch projects if no projectId is provided
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
    enabled: !projectId, // Only fetch if no projectId is provided
  });

  const decodedProjects = useMemo(
    () =>
      projects.map((project) => ({
        id: String(project.id),
        name: project.name,
      })),
    [projects]
  );

  useEffect(() => {
    if (!projectId && decodedProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(decodedProjects[0].id);
    }
  }, [projectId, decodedProjects, selectedProjectId]);

  const loadProjectFiles = useCallback(
    async (targetId: string) => {
      setIsLoadingFiles(true);
      try {
        const response = await fetch(`/api/projects/${targetId}/files`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch project files");
        }

        const data = await response.json();

        const mapped = data.map((file: any) => ({
          id: file.id,
          name: file.originalName || file.name,
          size: file.size,
          mimeType: file.mimeType,
          uploadedAt: file.createdAt,
        }));
        setFiles(mapped);
      } catch (error) {
        console.error("Failed to load files", error);
        setFiles([]);
      } finally {
        setIsLoadingFiles(false);
      }
    },
    []
  );

  useEffect(() => {
    const target = projectId || selectedProjectId;
    if (!target) {
      setFiles([]);
      return;
    }
    void loadProjectFiles(target);
  }, [projectId, selectedProjectId, loadProjectFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const uploadFiles = async (filesToUpload: File[]) => {
    const targetProjectId = projectId || selectedProjectId;
    
    if (!targetProjectId) {
      console.error("No project selected for upload");
      return;
    }
    
    setIsUploading(true);
    try {
      await Promise.all(
        filesToUpload.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("projectId", targetProjectId);

          const response = await fetch("/api/files/upload", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          const payload = await response.json().catch(() => null);

          if (!response.ok || !payload) {
            const message =
              payload?.error || `Failed to upload ${file.name}`;
            throw new Error(message);
          }

          const uploadedFile = payload;

          setFiles((prev) => [
            {
              id: uploadedFile.id,
              name:
                uploadedFile.originalName || uploadedFile.name || file.name,
              size: uploadedFile.size,
              mimeType: uploadedFile.mimeType || file.type,
              uploadedAt: uploadedFile.createdAt || new Date().toISOString(),
            },
            ...prev,
          ]);
        })
      );
      await loadProjectFiles(targetProjectId);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "/api/files",
      });
    } catch (error) {
      console.error("Upload error", error);
    } finally {
      setIsUploading(false);
    }
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    uploadFiles(droppedFiles);
  }, []);

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".pdf,.doc,.docx,.txt";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const selectedFiles = Array.from(target.files);
        uploadFiles(selectedFiles);
      }
    };
    input.click();
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!fileId) return;
    if (!confirm("Delete this file?")) return;
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete file");
      }

      const target = projectId || selectedProjectId;
      if (target) {
        await loadProjectFiles(target);
      }
      await queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "/api/files",
      });
    } catch (error) {
      console.error("Delete file error", error);
    }
  };

  const handleViewFile = (fileId: string) => {
    console.log("View file:", fileId);
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      // Get signed download URL from backend
      const response = await fetch(`/api/files/${fileId}/download`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }

      const data = await response.json();

      if (data.isFallback) {
        const byteCharacters = decodeBase64(data.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: data.mimeType || "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.fileName || `file-${fileId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (data.isLegacy) {
        // Handle legacy files that don't use cloud storage
        const blob = new Blob([data.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `file-${fileId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Use signed URL for cloud storage files
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = data.fileName || `file-${fileId}`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download error:", error);
      // Could add toast notification here
    }
  };

  return (
    <div className="space-y-4">
      {/* Project Selection (if no projectId provided) */}
      {!projectId && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Project</label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a project to upload files to" />
            </SelectTrigger>
            <SelectContent>
              {decodedProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload
            className={`mx-auto h-12 w-12 mb-4 ${
              isDragOver ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <h3 className="text-lg font-medium mb-2">Upload Research Files</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop your PDF, Word docs, or text files here, or click to
            browse
          </p>
          <Button
            onClick={handleFileSelect}
            variant="outline"
            disabled={isUploading || (!projectId && !selectedProjectId)}
            data-testid="button-upload-files"
          >
            {isUploading ? "Uploading..." : "Choose Files"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supports PDF, DOC, DOCX, TXT (Max 10MB each)
          </p>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {isLoadingFiles ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          Loading files...
        </div>
      ) : files.length > 0 ? (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">
            Uploaded Files ({files.length})
          </h4>
          {files.map((file) => (
            <Card
              key={file.id}
              className="hover-elevate"
              data-testid={`file-item-${file.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {file.mimeType.split("/").pop()?.toUpperCase() || "FILE"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {`${(file.size / 1024 / 1024).toFixed(1)} MB`}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleViewFile(file.id)}
                      data-testid={`button-view-${file.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleDownloadFile(file.id)}
                      data-testid={`button-download-${file.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteFile(file.id)}
                      data-testid={`button-delete-${file.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
