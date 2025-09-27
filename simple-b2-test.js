import AWS from "aws-sdk";
import * as dotenv from "dotenv";

dotenv.config();

console.log("🧪 Simple B2 Connection Test...\n");

// Configure AWS SDK for Backblaze B2
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

async function testConnection() {
  try {
    console.log("📡 Testing connection to Backblaze B2...");
    console.log(`   Endpoint: ${process.env.B2_ENDPOINT}`);
    console.log(`   Bucket: ${BUCKET_NAME}`);

    // Simple list objects request to test connection
    const result = await s3
      .listObjectsV2({
        Bucket: BUCKET_NAME,
        MaxKeys: 1,
      })
      .promise();

    console.log("✅ Connection successful!");
    console.log(
      `   Found ${result.Contents?.length || 0} objects (showing max 1)`
    );

    if (result.Contents && result.Contents.length > 0) {
      console.log(`   Sample object: ${result.Contents[0].Key}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log("\n🎉 Backblaze B2 is properly configured and accessible!");
      process.exit(0);
    } else {
      console.log("\n💥 B2 connection test failed!");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
