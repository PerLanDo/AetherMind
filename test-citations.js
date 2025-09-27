// Test script for Citation Generator functionality
const testCitationGenerator = async () => {
  const baseUrl = "http://localhost:5000";

  console.log("📚 Citation Generator Test Suite");
  console.log("=================================\n");

  // Test 1: Get format guidelines
  console.log("Test 1: Format Guidelines");
  try {
    const response = await fetch(`${baseUrl}/api/citations/formats`, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const guidelines = await response.json();
      console.log("✅ Format guidelines loaded:", Object.keys(guidelines));
    } else {
      console.log("❌ Failed to load format guidelines:", response.status);
    }
  } catch (error) {
    console.log("❌ Format guidelines error:", error.message);
  }

  // Test 2: Generate citation from URL
  console.log("\nTest 2: Generate Citation from URL");
  try {
    const response = await fetch(`${baseUrl}/api/citations/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        source: "https://example.com/article",
        sourceType: "url",
        format: "apa",
      }),
    });

    if (response.ok) {
      const citation = await response.json();
      console.log("✅ Citation generated successfully");
      console.log("   Format:", citation.format);
      console.log("   Citation:", citation.citation.substring(0, 100) + "...");
    } else {
      const error = await response.json();
      console.log(
        "❌ Citation generation failed:",
        error.error || response.status
      );
    }
  } catch (error) {
    console.log("❌ Citation generation error:", error.message);
  }

  // Test 3: Generate citation from DOI
  console.log("\nTest 3: Generate Citation from DOI");
  try {
    const response = await fetch(`${baseUrl}/api/citations/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        source: "10.1038/nature12373",
        sourceType: "doi",
        format: "mla",
      }),
    });

    if (response.ok) {
      const citation = await response.json();
      console.log("✅ DOI citation generated successfully");
      console.log("   Format:", citation.format);
      console.log("   Source type:", citation.sourceType);
    } else {
      const error = await response.json();
      console.log("❌ DOI citation failed:", error.error || response.status);
    }
  } catch (error) {
    console.log("❌ DOI citation error:", error.message);
  }

  // Test 4: Manual citation
  console.log("\nTest 4: Manual Citation Entry");
  try {
    const response = await fetch(`${baseUrl}/api/citations/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        source: "Manual test entry",
        sourceType: "manual",
        format: "chicago",
        extractedInfo: {
          title: "Test Article Title",
          authors: ["Smith, John", "Doe, Jane"],
          publicationDate: "2023",
          journal: "Test Journal",
          volume: "10",
          issue: "2",
          pages: "15-30",
        },
      }),
    });

    if (response.ok) {
      const citation = await response.json();
      console.log("✅ Manual citation generated successfully");
      console.log("   Citation:", citation.citation);
      console.log("   In-text:", citation.inText);
    } else {
      const error = await response.json();
      console.log("❌ Manual citation failed:", error.error || response.status);
    }
  } catch (error) {
    console.log("❌ Manual citation error:", error.message);
  }

  console.log("\n🎉 Citation Generator test suite completed!");
};

// Run after a short delay to ensure server is ready
setTimeout(() => {
  testCitationGenerator().catch(console.error);
}, 2000);
