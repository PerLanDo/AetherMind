import React from "react";
import { downloadFile } from "../lib/api";

export function FileList({
  files,
  onFileSelect,
  onFileDelete,
  selectedTags,
}: FileListProps) {
  // ...existing code...

  const handleDownload = async (file: FileData) => {
    try {
      const downloadData = await downloadFile(file.id);

      if (downloadData.isLegacy && downloadData.content) {
        // Handle legacy files with inline content
        const blob = new Blob([downloadData.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (downloadData.downloadUrl) {
        // Handle cloud-stored files with signed URLs
        const a = document.createElement("a");
        a.href = downloadData.downloadUrl;
        a.download = downloadData.fileName || file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error("No download method available");
      }
    } catch (error) {
      console.error("Download failed:", error);
      // Show error notification
    }
  };

  // ...existing code...
}
