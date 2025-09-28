import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  GetObjectCommandOutput,
  HeadObjectCommandOutput,
  _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const B2_ENDPOINT =
  process.env.B2_ENDPOINT || "https://s3.us-west-004.backblazeb2.com";
const BUCKET_NAME = process.env.B2_BUCKET_NAME || "scholarsync-storage";

const hasB2Configuration = Boolean(
  process.env.B2_ACCESS_KEY_ID && process.env.B2_SECRET_ACCESS_KEY
);

const s3Client = hasB2Configuration
  ? new S3Client({
      endpoint: B2_ENDPOINT,
      region: process.env.B2_REGION || "us-west-004",
      credentials: {
        accessKeyId: process.env.B2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    })
  : null;

if (!hasB2Configuration) {
  console.warn(
    "[StorageService] Backblaze B2 credentials are not fully configured. File uploads will be stored in the database only."
  );
}

function ensureClient(): S3Client {
  if (!s3Client) {
    const error = new Error("Cloud storage is not configured");
    error.name = "CloudStorageNotConfiguredError";
    throw error;
  }
  return s3Client;
}

export interface UploadResult {
  cloudKey: string;
  url: string;
  size: number;
}

export interface SignedUrlResult {
  url: string;
  expiresIn: number;
}

export class StorageService {
  static isConfigured(): boolean {
    return Boolean(s3Client);
  }

  /**
   * Upload file to Backblaze B2
   */
  static async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string
  ): Promise<UploadResult> {
    const client = ensureClient();
    const fileExtension = originalName.split(".").pop() || "";
    const cloudKey = `files/${userId}/${uuidv4()}.${fileExtension}`;

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: cloudKey,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          "original-name": originalName,
          "user-id": userId,
          "upload-date": new Date().toISOString(),
        },
      });

      await client.send(uploadCommand);

      // Construct the URL manually since v3 doesn't return Location
      const url = `${B2_ENDPOINT}/${BUCKET_NAME}/${cloudKey}`;

      return {
        cloudKey,
        url,
        size: buffer.length,
      };
    } catch (error) {
      console.error("Failed to upload file to B2:", error);
      throw new Error("File upload failed");
    }
  }

  /**
   * Download file from Backblaze B2
   */
  static async downloadFile(cloudKey: string): Promise<Buffer> {
    const client = ensureClient();
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: cloudKey,
      });

      const result = await client.send(command);
      
      // Convert the stream to buffer
      const chunks: Uint8Array[] = [];
      if (result.Body) {
        // @ts-ignore - Body can be a stream in Node.js
        for await (const chunk of result.Body) {
          chunks.push(chunk);
        }
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error("Failed to download file from B2:", error);
      throw new Error("File download failed");
    }
  }

  /**
   * Generate signed URL for file download
   */
  static async getSignedDownloadUrl(
    cloudKey: string,
    expiresIn: number = 3600
  ): Promise<SignedUrlResult> {
    const client = ensureClient();
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: cloudKey,
      });

      const url = await getSignedUrl(client, command, { expiresIn });

      return {
        url,
        expiresIn,
      };
    } catch (error) {
      console.error("Failed to generate signed URL:", error);
      throw new Error("Failed to generate download URL");
    }
  }

  /**
   * Delete file from Backblaze B2
   */
  static async deleteFile(cloudKey: string): Promise<void> {
    if (!s3Client) {
      console.warn(
        "[StorageService] Cloud storage not configured; skipping remote delete."
      );
      return;
    }
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: cloudKey,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error("Failed to delete file from B2:", error);
      throw new Error("File deletion failed");
    }
  }

  /**
   * Check if file exists in Backblaze B2
   */
  static async fileExists(cloudKey: string): Promise<boolean> {
    if (!s3Client) {
      return false;
    }
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: cloudKey,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata from Backblaze B2
   */
  static async getFileMetadata(
    cloudKey: string
  ): Promise<HeadObjectCommandOutput> {
    const client = ensureClient();
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: cloudKey,
      });

      return await client.send(command);
    } catch (error) {
      console.error("Failed to get file metadata:", error);
      throw new Error("Failed to get file metadata");
    }
  }

  /**
   * Copy file within Backblaze B2
   */
  static async copyFile(
    sourceKey: string,
    destinationKey: string
  ): Promise<void> {
    const client = ensureClient();
    try {
      const command = new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${sourceKey}`,
        Key: destinationKey,
      });

      await client.send(command);
    } catch (error) {
      console.error("Failed to copy file:", error);
      throw new Error("File copy failed");
    }
  }

  /**
   * List files in a directory
   */
  static async listFiles(
    prefix: string,
    maxKeys: number = 1000
  ): Promise<_Object[]> {
    const client = ensureClient();
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const result = await client.send(command);
      return result.Contents || [];
    } catch (error) {
      console.error("Failed to list files:", error);
      throw new Error("Failed to list files");
    }
  }
}
