import React, { useEffect, useRef, useState } from "react";
import { researchAPI } from "../../../api";
import { formatDate, formatFileSize, getFileIcon } from "../../../utils";

const FileManager = ({ projectId }) => {
  const [files, setFiles] = useState([]); // Empty array instead of placeholder files
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    if (projectId) {
      fetchFiles();
    }
  }, [projectId]);

  const fetchFiles = async () => {
    try {
      const response = await researchAPI.getProjectFiles(projectId);
      setFiles(response.data || []);
    } catch (error) {
      console.error("Failed to fetch files:", error);
      setFiles([]);
    }
  };

  const renderEmptyState = () => (
    <div className="files-empty-state">
      <div className="empty-icon">📁</div>
      <h3>No files uploaded yet</h3>
      <p>
        Upload documents, PDFs, images, or other research materials to get
        started.
      </p>
      <button
        className="upload-button primary"
        onClick={() => fileInputRef.current?.click()}
      >
        📤 Upload Files
      </button>
      <div className="supported-formats">
        <small>
          Supported: PDF, DOCX, TXT, CSV, Images (PNG, JPG), and more
        </small>
      </div>
    </div>
  );

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h3>Project Files</h3>
        {files.length > 0 && (
          <div className="file-actions">
            <button onClick={() => fileInputRef.current?.click()}>
              📤 Upload
            </button>
            {selectedFiles.length > 0 && (
              <button onClick={deleteSelectedFiles} className="danger">
                🗑️ Delete ({selectedFiles.length})
              </button>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg"
      />

      <div className="files-container">
        {files.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="files-grid">
            {files.map((file) => (
              <div
                key={file._id}
                className={`file-item ${
                  selectedFiles.includes(file._id) ? "selected" : ""
                }`}
                onClick={() => toggleFileSelection(file._id)}
              >
                <div className="file-icon">{getFileIcon(file.type)}</div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                  </div>
                </div>
                <button
                  className="file-download"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFile(file);
                  }}
                >
                  ⬇️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;
