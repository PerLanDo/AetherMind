// version-control.ts

export interface FileVersion {
  id: string;
  content: string;
  timestamp: number;
}

export interface ConflictResolution {
  type: "current" | "incoming" | "manual";
  resolvedContent?: string;
}

export interface MergeConflict {
  startLine: number;
  endLine: number;
  currentContent: string;
  incomingContent: string;
  baseContent?: string;
}

export interface MergeResult {
  success: boolean;
  mergedContent?: string;
  conflicts?: MergeConflict[];
}

export function compareVersions(
  version1: FileVersion,
  version2: FileVersion
): {
  additions: number;
  deletions: number;
  modifications: number;
  diff: Array<{
    type: "add" | "delete" | "modify" | "unchanged";
    lineNumber: number;
    content: string;
    oldContent?: string;
  }>;
} {
  const lines1 = version1.content.split("\n");
  const lines2 = version2.content.split("\n");

  // Simple diff algorithm using dynamic programming
  const dp: number[][] = Array(lines1.length + 1)
    .fill(null)
    .map(() => Array(lines2.length + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= lines1.length; i++) {
    for (let j = 1; j <= lines2.length; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const diff: Array<{
    type: "add" | "delete" | "modify" | "unchanged";
    lineNumber: number;
    content: string;
    oldContent?: string;
  }> = [];

  let i = lines1.length;
  let j = lines2.length;
  let lineNumber = Math.max(lines1.length, lines2.length);
  let additions = 0;
  let deletions = 0;
  let modifications = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      diff.unshift({
        type: "unchanged",
        lineNumber: lineNumber--,
        content: lines1[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({
        type: "add",
        lineNumber: lineNumber--,
        content: lines2[j - 1],
      });
      additions++;
      j--;
    } else if (i > 0) {
      diff.unshift({
        type: "delete",
        lineNumber: lineNumber--,
        content: lines1[i - 1],
      });
      deletions++;
      i--;
    }
  }

  return { additions, deletions, modifications, diff };
}

export function mergeVersions(
  baseVersion: FileVersion,
  currentVersion: FileVersion,
  incomingVersion: FileVersion
): MergeResult {
  const baseLines = baseVersion.content.split("\n");
  const currentLines = currentVersion.content.split("\n");
  const incomingLines = incomingVersion.content.split("\n");

  const conflicts: MergeConflict[] = [];
  const mergedLines: string[] = [];

  let baseIndex = 0;
  let currentIndex = 0;
  let incomingIndex = 0;

  while (
    baseIndex < baseLines.length ||
    currentIndex < currentLines.length ||
    incomingIndex < incomingLines.length
  ) {
    const baseLine = baseLines[baseIndex] || "";
    const currentLine = currentLines[currentIndex] || "";
    const incomingLine = incomingLines[incomingIndex] || "";

    if (baseLine === currentLine && baseLine === incomingLine) {
      // No changes
      mergedLines.push(baseLine);
      baseIndex++;
      currentIndex++;
      incomingIndex++;
    } else if (baseLine === currentLine && baseLine !== incomingLine) {
      // Only incoming changed
      mergedLines.push(incomingLine);
      baseIndex++;
      currentIndex++;
      incomingIndex++;
    } else if (baseLine === incomingLine && baseLine !== currentLine) {
      // Only current changed
      mergedLines.push(currentLine);
      baseIndex++;
      currentIndex++;
      incomingIndex++;
    } else {
      // Conflict detected
      const conflictStart = mergedLines.length;
      const currentContent: string[] = [];
      const incomingContent: string[] = [];

      // Collect conflicting lines
      while (
        currentIndex < currentLines.length &&
        currentLines[currentIndex] !== baseLine
      ) {
        currentContent.push(currentLines[currentIndex++]);
      }
      while (
        incomingIndex < incomingLines.length &&
        incomingLines[incomingIndex] !== baseLine
      ) {
        incomingContent.push(incomingLines[incomingIndex++]);
      }

      conflicts.push({
        startLine: conflictStart,
        endLine:
          conflictStart +
          Math.max(currentContent.length, incomingContent.length),
        currentContent: currentContent.join("\n"),
        incomingContent: incomingContent.join("\n"),
        baseContent: baseLine,
      });

      // Add conflict markers
      mergedLines.push("<<<<<<< CURRENT");
      mergedLines.push(...currentContent);
      mergedLines.push("=======");
      mergedLines.push(...incomingContent);
      mergedLines.push(">>>>>>> INCOMING");

      baseIndex++;
    }
  }

  return {
    success: conflicts.length === 0,
    mergedContent: conflicts.length === 0 ? mergedLines.join("\n") : undefined,
    conflicts,
  };
}

export function detectConflicts(
  baseVersion: FileVersion,
  version1: FileVersion,
  version2: FileVersion
): MergeConflict[] {
  const mergeResult = mergeVersions(baseVersion, version1, version2);
  return mergeResult.conflicts || [];
}

export function resolveConflict(
  conflict: MergeConflict,
  resolution: ConflictResolution
): string {
  switch (resolution.type) {
    case "current":
      return conflict.currentContent;
    case "incoming":
      return conflict.incomingContent;
    case "manual":
      return resolution.resolvedContent || conflict.currentContent;
    default:
      return conflict.currentContent;
  }
}

export function applyMergeResolution(
  content: string,
  conflicts: MergeConflict[],
  resolutions: Map<number, ConflictResolution>
): string {
  const lines = content.split("\n");
  let result = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line === "<<<<<<< CURRENT") {
      // Find corresponding conflict
      const conflictIndex = conflicts.findIndex(
        (c) => c.startLine <= i && i <= c.endLine
      );
      if (conflictIndex !== -1) {
        const conflict = conflicts[conflictIndex];
        const resolution = resolutions.get(conflictIndex);

        if (resolution) {
          result += resolveConflict(conflict, resolution) + "\n";
        } else {
          result += conflict.currentContent + "\n";
        }

        // Skip to after the conflict markers
        while (i < lines.length && lines[i] !== ">>>>>>> INCOMING") {
          i++;
        }
        i++; // Skip the closing marker
      }
    } else {
      result += line + "\n";
      i++;
    }
  }

  return result.slice(0, -1); // Remove trailing newline
}
