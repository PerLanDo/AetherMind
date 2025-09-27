import { useState, useCallback } from "react";
import { Upload, FileText, Trash2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export default function FileUploadZone() {
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "Climate_Research_Paper_v2.pdf",
      size: "2.4 MB",
      type: "PDF",
      uploadedAt: "2 hours ago"
    },
    {
      id: "2", 
      name: "Literature_Review_Notes.docx",
      size: "1.8 MB",
      type: "DOC",
      uploadedAt: "1 day ago"
    }
  ]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', droppedFiles.map(f => f.name));
    
    // Mock file upload
    const newFiles = droppedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      uploadedAt: 'Just now'
    }));
    
    setFiles(prev => [...newFiles, ...prev]);
  }, []);

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.txt';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const selectedFiles = Array.from(target.files);
        console.log('Files selected:', selectedFiles.map(f => f.name));
        
        const newFiles = selectedFiles.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
          uploadedAt: 'Just now'
        }));
        
        setFiles(prev => [...newFiles, ...prev]);
      }
    };
    input.click();
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    console.log('File deleted:', fileId);
  };

  const handleViewFile = (fileId: string) => {
    console.log('View file:', fileId);
  };

  const handleDownloadFile = (fileId: string) => {
    console.log('Download file:', fileId);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className={`mx-auto h-12 w-12 mb-4 ${
            isDragOver ? 'text-primary' : 'text-muted-foreground'
          }`} />
          <h3 className="text-lg font-medium mb-2">Upload Research Files</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop your PDF, Word docs, or text files here, or click to browse
          </p>
          <Button 
            onClick={handleFileSelect} 
            variant="outline"
            data-testid="button-upload-files"
          >
            Choose Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supports PDF, DOC, DOCX, TXT (Max 10MB each)
          </p>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Uploaded Files ({files.length})</h4>
          {files.map((file) => (
            <Card key={file.id} className="hover-elevate" data-testid={`file-item-${file.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {file.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{file.size}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{file.uploadedAt}</span>
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
      )}
    </div>
  );
}