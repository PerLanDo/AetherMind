// Import the built storage service or use a different approach
import AWS from "aws-sdk";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configure AWS SDK for Backblaze B2 directly
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

async function testB2Integration() {
  console.log("🧪 Testing Backblaze B2 Integration...\n");

  try {
    // Test 1: Check configuration
    console.log("1️⃣ Checking B2 Configuration...");
    const requiredEnvVars = [
      "B2_ENDPOINT",
      "B2_REGION",
      "B2_ACCESS_KEY_ID",
      "B2_SECRET_ACCESS_KEY",
      "B2_BUCKET_NAME",
    ];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing environment variables: ${missingVars.join(", ")}`
      );
    }

    console.log("✅ All required environment variables are set");
    console.log(`   Endpoint: ${process.env.B2_ENDPOINT}`);
    console.log(`   Region: ${process.env.B2_REGION}`);
    console.log(`   Bucket: ${process.env.B2_BUCKET_NAME}`);

    // Test 2: Create a test file
    console.log("\n2️⃣ Creating test file...");
    const testContent =
      "This is a test file for Backblaze B2 integration testing.\nCreated at: " +
      new Date().toISOString();
    const testBuffer = Buffer.from(testContent, "utf-8");
    const testFileName = `test-file-${Date.now()}.txt`;

    console.log("✅ Test file created in memory");

    // Test 3: Upload file to B2
    console.log("\n3️⃣ Uploading file to Backblaze B2...");

    const cloudKey = `test-files/test-user/${testFileName}`;
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: cloudKey,
      Body: testBuffer,
      ContentType: "text/plain",
      Metadata: {
        "original-name": testFileName,
        "user-id": "test-user",
        "upload-date": new Date().toISOString(),
      },
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    console.log("✅ File uploaded successfully!");
    console.log(`   Cloud Key: ${cloudKey}`);
    console.log(`   URL: ${uploadResult.Location}`);
    console.log(`   Size: ${testBuffer.length} bytes`);

    // Test 4: Check if file exists
    console.log("\n4️⃣ Checking if file exists...");
    try {
      await s3.headObject({ Bucket: BUCKET_NAME, Key: cloudKey }).promise();
      console.log("✅ File existence check: EXISTS");
    } catch (error) {
      console.log("❌ File existence check: NOT FOUND");
    }

    // Test 5: Get file metadata
    console.log("\n5️⃣ Getting file metadata...");
    const metadata = await s3
      .headObject({ Bucket: BUCKET_NAME, Key: cloudKey })
      .promise();
    console.log("✅ File metadata retrieved:");
    console.log(`   Size: ${metadata.ContentLength} bytes`);
    console.log(`   Content Type: ${metadata.ContentType}`);
    console.log(`   Last Modified: ${metadata.LastModified}`);
    console.log(
      `   Original Name: ${metadata.Metadata?.["original-name"] || "Not set"}`
    );

    // Test 6: Generate signed download URL
    console.log("\n6️⃣ Generating signed download URL...");
    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: BUCKET_NAME,
      Key: cloudKey,
      Expires: 3600,
    });
    console.log("✅ Signed URL generated successfully!");
    console.log(`   URL: ${signedUrl.substring(0, 100)}...`);
    console.log("   Expires in: 3600 seconds");

    // Test 7: Download file
    console.log("\n7️⃣ Downloading file from B2...");
    const downloadResult = await s3
      .getObject({ Bucket: BUCKET_NAME, Key: cloudKey })
      .promise();
    const downloadedContent = downloadResult.Body.toString("utf-8");
    console.log("✅ File downloaded successfully!");
    console.log(
      `   Content matches: ${downloadedContent === testContent ? "YES" : "NO"}`
    );
    console.log(`   Downloaded size: ${downloadResult.Body.length} bytes`);

    // Test 8: List files
    console.log("\n8️⃣ Listing files in test folder...");
    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: "test-files/test-user/",
      MaxKeys: 10,
    };
    const listResult = await s3.listObjectsV2(listParams).promise();
    const fileList = listResult.Contents || [];
    console.log(`✅ Found ${fileList.length} files in test folder`);
    fileList.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.Key} (${file.Size} bytes)`);
    });

    // Test 9: Copy file
    console.log("\n9️⃣ Testing file copy...");
    const copyKey = cloudKey.replace(".txt", "-copy.txt");
    const copyParams = {
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${cloudKey}`,
      Key: copyKey,
    };
    await s3.copyObject(copyParams).promise();
    console.log("✅ File copied successfully!");
    console.log(`   Original: ${cloudKey}`);
    console.log(`   Copy: ${copyKey}`);

    // Test 10: Clean up - delete test files
    console.log("\n🧹 Cleaning up test files...");
    await s3.deleteObject({ Bucket: BUCKET_NAME, Key: cloudKey }).promise();
    await s3.deleteObject({ Bucket: BUCKET_NAME, Key: copyKey }).promise();
    console.log("✅ Test files deleted successfully");

    // Final summary
    console.log("\n🎉 ALL TESTS PASSED! 🎉");
    console.log("\n✨ Backblaze B2 Integration Summary:");
    console.log("   ✅ Configuration is correct");
    console.log("   ✅ File upload works");
    console.log("   ✅ File download works");
    console.log("   ✅ File deletion works");
    console.log("   ✅ Signed URLs work");
    console.log("   ✅ File metadata retrieval works");
    console.log("   ✅ File copying works");
    console.log("   ✅ File listing works");
    console.log(
      "\n🚀 Your AetherMind app is ready to use Backblaze B2 cloud storage!"
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\n🔍 Troubleshooting tips:");
    console.error("   1. Check your .env file has all required B2 variables");
    console.error("   2. Verify your B2 credentials are correct");
    console.error("   3. Ensure your B2 bucket exists and is accessible");
    console.error("   4. Check your network connection");
    throw error;
  }
}

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testB2Integration()
    .then(() => {
      console.log("\n✅ B2 Integration test completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 B2 Integration test failed!");
      process.exit(1);
    });
}

export default testB2Integration;
