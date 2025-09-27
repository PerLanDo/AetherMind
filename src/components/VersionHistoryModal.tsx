import React, { useState, useEffect } from "react";
import { X, Clock, GitBranch, ArrowLeft, Eye, RotateCcw } from "lucide-react";
import { FileVersion, compareVersions } from "../lib/version-control";
import { VersionComparison } from "./VersionComparison";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  currentVersion: FileVersion;
  onRollback: (version: FileVersion) => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  fileId,
  currentVersion,
  onRollback,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<FileVersion | null>(
    null
  );
  const [compareVersion, setCompareVersion] = useState<FileVersion | null>(
    null
  );
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVersionHistory();
    }
  }, [isOpen, fileId]);

  const loadVersionHistory = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual implementation
      const mockVersions: FileVersion[] = [
        {
          id: "v1",
          content: "Initial version content",
          timestamp: Date.now() - 86400000 * 3,
          author: "Alice",
          message: "Initial version",
        },
        {
          id: "v2",
          content: "Updated content with new features",
          timestamp: Date.now() - 86400000 * 2,
          author: "Bob",
          message: "Added new features",
        },
        {
          id: "v3",
          content: "Fixed bugs and improved performance",
          timestamp: Date.now() - 86400000,
          author: "Alice",
          message: "Bug fixes and performance improvements",
        },
        currentVersion,
      ].sort((a, b) => b.timestamp - a.timestamp);

      setVersions(mockVersions);
    } catch (error) {
      console.error("Failed to load version history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareVersions = (
    version1: FileVersion,
    version2: FileVersion
  ) => {
    setSelectedVersion(version1);
    setCompareVersion(version2);
    setShowComparison(true);
  };

  const handleRollback = (version: FileVersion) => {
    if (
      window.confirm(
        `Are you sure you want to rollback to version from ${new Date(
          version.timestamp
        ).toLocaleString()}?`
      )
    ) {
      onRollback(version);
      onClose();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isOpen) return null;

  if (showComparison && selectedVersion && compareVersion) {
    return (
      <VersionComparison
        version1={selectedVersion}
        version2={compareVersion}
        onClose={() => setShowComparison(false)}
        onBack={() => setShowComparison(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Version History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => {
                const isLatest = index === 0;
                const previousVersion = versions[index + 1];
                let stats = null;

                if (previousVersion) {
                  stats = compareVersions(previousVersion, version);
                }

                return (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 ${
                      isLatest
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <GitBranch className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {version.message || "No message"}
                          </span>
                          {isLatest && (
                            <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                              Current
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimestamp(version.timestamp)}</span>
                          </div>
                          <span>by {version.author}</span>
                        </div>

                        {stats && (
                          <div className="flex items-center space-x-4 text-sm">
                            {stats.additions > 0 && (
                              <span className="text-green-600">
                                +{stats.additions} additions
                              </span>
                            )}
                            {stats.deletions > 0 && (
                              <span className="text-red-600">
                                -{stats.deletions} deletions
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isLatest && (
                          <>
                            <button
                              onClick={() =>
                                handleCompareVersions(version, currentVersion)
                              }
                              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Compare</span>
                            </button>
                            <button
                              onClick={() => handleRollback(version)}
                              className="flex items-center space-x-1 px-3 py-1 text-sm text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Rollback</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
