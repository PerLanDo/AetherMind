```typescript
// src/lib/api.ts

const API_BASE = 'https://your-api-base-url.com'; // Replace with your actual API base URL

export const downloadFile = async (fileId: string): Promise<{
  downloadUrl?: string;
  content?: string;
  fileName?: string;
  mimeType?: string;
  isLegacy?: boolean;
}> => {
  const response = await fetch(`${API_BASE}/files/${fileId}/download`);
  if (!response.ok) {
    throw new Error('Failed to get download URL');
  }
  return response.json();
};

export const getFileContent = async (fileId: string): Promise<{ content: string }> => {
  const response = await fetch(`${API_BASE}/files/${fileId}/content`);
  if (!response.ok) {
    throw new Error('Failed to get file content');
  }
  return response.json();
};

// ...existing code...
```