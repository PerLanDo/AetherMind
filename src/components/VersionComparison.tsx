import React from "react";
import { ArrowLeft, X } from "lucide-react";
import { FileVersion, compareVersions } from "../lib/version-control";

interface VersionComparisonProps {
  version1: FileVersion;
  version2: FileVersion;
  onClose: () => void;
  onBack: () => void;
}

export function VersionComparison({
  version1,
  version2,
  onClose,
  onBack,
}: VersionComparisonProps) {
  const comparison = compareVersions(version1, version2);

  const renderDiffLine = (
    item: {
      type: "add" | "delete" | "modify" | "unchanged";
      lineNumber: number;
      content: string;
      oldContent?: string;
    },
    side: "left" | "right"
  ) => {
    const getLineStyle = () => {
      switch (item.type) {
        case "add":
          return side === "right"
            ? "bg-green-100 border-l-4 border-green-500"
            : "";
        case "delete":
          return side === "left" ? "bg-red-100 border-l-4 border-red-500" : "";
        case "modify":
          return "bg-yellow-100 border-l-4 border-yellow-500";
        default:
          return "";
      }
    };

    const shouldShowLine = () => {
      if (item.type === "add") return side === "right";
      if (item.type === "delete") return side === "left";
      return true;
    };

    if (!shouldShowLine()) {
      return (
        <div key={`${side}-${item.lineNumber}`} className="flex">
          <div className="w-12 text-xs text-gray-400 text-right pr-2 py-1 border-r bg-gray-50"></div>
          <div className="flex-1 px-3 py-1 text-sm font-mono"></div>
        </div>
      );
    }

    return (
      <div
        key={`${side}-${item.lineNumber}`}
        className={`flex ${getLineStyle()}`}
      >
        <div className="w-12 text-xs text-gray-400 text-right pr-2 py-1 border-r bg-gray-50">
          {item.lineNumber}
        </div>
        <div className="flex-1 px-3 py-1 text-sm font-mono whitespace-pre-wrap">
          {item.content}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-gray-300"></div>
            <h2 className="text-lg font-semibold text-gray-900">
              Version Comparison
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                {new Date(version1.timestamp).toLocaleString()}
              </h3>
              <p className="text-sm text-gray-600">by {version1.author}</p>
              <p className="text-xs text-gray-500">{version1.message}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                {new Date(version2.timestamp).toLocaleString()}
              </h3>
              <p className="text-sm text-gray-600">by {version2.author}</p>
              <p className="text-xs text-gray-500">{version2.message}</p>
            </div>
          </div>
        </div>

        <div className="border-b bg-gray-50 px-4 py-2">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>{comparison.additions} additions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>{comparison.deletions} deletions</span>
            </div>
            {comparison.modifications > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>{comparison.modifications} modifications</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex h-[60vh] overflow-hidden">
          <div className="w-1/2 border-r">
            <div className="bg-gray-100 px-4 py-2 border-b">
              <h4 className="font-medium text-gray-900">Previous Version</h4>
            </div>
            <div className="overflow-y-auto h-full">
              {comparison.diff.map((item) => renderDiffLine(item, "left"))}
            </div>
          </div>

          <div className="w-1/2">
            <div className="bg-gray-100 px-4 py-2 border-b">
              <h4 className="font-medium text-gray-900">Current Version</h4>
            </div>
            <div className="overflow-y-auto h-full">
              {comparison.diff.map((item) => renderDiffLine(item, "right"))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing differences between versions
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <div className="w-3 h-3 bg-red-100 border-l-2 border-red-500"></div>
                <span>Removed</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <div className="w-3 h-3 bg-green-100 border-l-2 border-green-500"></div>
                <span>Added</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <div className="w-3 h-3 bg-yellow-100 border-l-2 border-yellow-500"></div>
                <span>Modified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
