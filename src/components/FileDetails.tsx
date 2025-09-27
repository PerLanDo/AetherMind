import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { FileVersion } from "../lib/version-control";
import { getFileContent } from "../lib/api";

interface FileDetailsProps {
  file: {
    id: string;
    content: string;
    tags: string[];
  };
  onClose: () => void;
  onSave: (id: string, content: string, tags: string[]) => void;
}

export function FileDetails({ file, onClose, onSave }: FileDetailsProps) {
  const [content, setContent] = useState(file.content);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const currentVersion: FileVersion = {
    id: `current-${Date.now()}`,
    content: content,
    timestamp: Date.now(),
    author: "Current User", // Replace with actual user
    message: "Current version",
  };

  useEffect(() => {
    const loadContent = async () => {
      if (file.cloudKey) {
        try {
          const { content } = await getFileContent(file.id);
          setContent(content);
        } catch (error) {
          console.error("Failed to load file content:", error);
          setContent(file.content || ""); // Fallback to inline content
        }
      } else {
        setContent(file.content || "");
      }
    };

    loadContent();
  }, [file]);

  const handleRollback = (version: FileVersion) => {
    setContent(version.content);
    // Optionally save immediately or mark as modified
    onSave(file.id, version.content, file.tags);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-800">{file.id}</h2>
            <button
              onClick={() => setShowVersionHistory(true)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <Clock className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-60 p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <VersionHistoryModal
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        fileId={file.id}
        currentVersion={currentVersion}
        onRollback={handleRollback}
      />
    </div>
  );
}
