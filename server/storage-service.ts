import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

// Configure AWS SDK for Backblaze B2
const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT || "https://s3.us-west-004.backblazeb2.com",
  region: process.env.B2_REGION || "us-west-004",
  accessKeyId: process.env.B2_ACCESS_KEY_ID,
  secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || "aethermind-storage";

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
  /**
   * Upload file to Backblaze B2
   */
  static async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string
  ): Promise<UploadResult> {
    const fileExtension = originalName.split(".").pop() || "";
    const cloudKey = `files/${userId}/${uuidv4()}.${fileExtension}`;

    try {
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: cloudKey,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          "original-name": originalName,
          "user-id": userId,
          "upload-date": new Date().toISOString(),
        },
      };

      const result = await s3.upload(uploadParams).promise();

      return {
        cloudKey,
        url: result.Location,
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
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: cloudKey,
      };

      const result = await s3.getObject(params).promise();
      return result.Body as Buffer;
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
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: cloudKey,
        Expires: expiresIn,
      };

      const url = await s3.getSignedUrlPromise("getObject", params);

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
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: cloudKey,
      };

      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error("Failed to delete file from B2:", error);
      throw new Error("File deletion failed");
    }
  }

  /**
   * Check if file exists in Backblaze B2
   */
  static async fileExists(cloudKey: string): Promise<boolean> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: cloudKey,
      };

      await s3.headObject(params).promise();
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
  ): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: cloudKey,
      };

      return await s3.headObject(params).promise();
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
    try {
      const params: AWS.S3.CopyObjectRequest = {
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${sourceKey}`,
        Key: destinationKey,
      };

      await s3.copyObject(params).promise();
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
  ): Promise<AWS.S3.Object[]> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys,
      };

      const result = await s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      console.error("Failed to list files:", error);
      throw new Error("Failed to list files");
    }
  }
}
