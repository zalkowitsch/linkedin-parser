import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

console.log("🚀 Starting Simple PDF Test");

async function testPDF() {
  try {
    // Load the test PDF
    const pdfPath = path.join(process.cwd(), 'test_resume.pdf');

    if (!fs.existsSync(pdfPath)) {
      console.error("❌ test_resume.pdf not found");
      return false;
    }

    console.log(`📄 Loading PDF: ${pdfPath}`);
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Parse with pdf-parse
    console.log("⚙️  Parsing PDF content...");
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    console.log(`📊 Extracted ${text.length} characters of text`);

    // Basic validation checks
    const tests = [
      { name: "Contains test name 'John Silva'", test: text.includes('John Silva') },
      { name: "Contains test email", test: text.includes('john.silva@email.com') },
      { name: "Contains test company", test: text.includes('DataFlow Inc') || text.includes('TechFlow Systems') },
      { name: "Contains education", test: text.includes('Austin Business School') || text.includes('Business') },
      { name: "Has reasonable length", test: text.length > 100 }
    ];

    console.log("\n📋 Test Results:");
    let passedTests = 0;

    for (const test of tests) {
      const status = test.test ? "✅ PASS" : "❌ FAIL";
      console.log(`  ${status} - ${test.name}`);
      if (test.test) passedTests++;
    }

    console.log(`\n🎯 Summary: ${passedTests}/${tests.length} tests passed`);

    // Show sample of extracted text
    console.log("\n📄 Sample extracted text (first 500 chars):");
    console.log(text.substring(0, 500).replace(/\s+/g, ' ') + "...");

    if (passedTests === tests.length) {
      console.log("\n🎉 All tests passed! PDF contains expected test data.");
      return true;
    } else {
      console.log("\n⚠️  Some tests failed. PDF may need review.");
      return false;
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

testPDF().then(success => {
  process.exit(success ? 0 : 1);
});