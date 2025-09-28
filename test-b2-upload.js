import AWS from "aws-sdk";
import * as dotenv from "dotenv";

dotenv.config();

const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
  },
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME;

async function testUploadDownload() {
  console.log("🧪 Testing B2 Upload & Download...\n");

  try {
    // Create test file
    const testContent = `AetherMind B2 Integration Test\nTimestamp: ${new Date().toISOString()}`;
    const testKey = `scholarsync-test/test-${Date.now()}.txt`;

    console.log("1️⃣ Uploading test file...");
    await s3
      .upload({
        Bucket: BUCKET_NAME,
        Key: testKey,
        Body: testContent,
        ContentType: "text/plain",
      })
      .promise();
    console.log(`✅ File uploaded: ${testKey}`);

    console.log("\n2️⃣ Downloading test file...");
    const result = await s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: testKey,
      })
      .promise();

    const downloadedContent = result.Body.toString();
    console.log(`✅ File downloaded successfully`);
    console.log(
      `   Content matches: ${downloadedContent === testContent ? "YES" : "NO"}`
    );

    console.log("\n3️⃣ Generating signed URL...");
    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: BUCKET_NAME,
      Key: testKey,
      Expires: 3600,
    });
    console.log(`✅ Signed URL generated: ${signedUrl.substring(0, 80)}...`);

    console.log("\n4️⃣ Cleaning up...");
    await s3
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: testKey,
      })
      .promise();
    console.log("✅ Test file deleted");

    console.log("\n🎉 Upload/Download test completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return false;
  }
}

testUploadDownload()
  .then((success) => {
    if (success) {
      console.log("\n✅ Backblaze B2 integration is working perfectly!");
      console.log("🚀 AetherMind is ready to use cloud storage!");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
