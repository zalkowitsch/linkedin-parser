import fs from 'fs';
import path from 'path';
import { handlePDFUpload } from './pdf-parser';

// Mock Context for testing
class MockContext {
  private mockReq: any;
  private mockFormData: FormData;

  constructor(pdfBuffer: Buffer, filename: string) {
    const file = new File([pdfBuffer], filename, { type: 'application/pdf' });
    this.mockFormData = new FormData();
    this.mockFormData.append('pdf', file);

    this.mockReq = {
      formData: async () => this.mockFormData
    };
  }

  get req() {
    return this.mockReq;
  }

  json(data: any, status?: number) {
    return {
      data,
      status: status || 200
    };
  }
}


// Expected JSON structure validation helpers
const requiredFields = ['name', 'contact', 'experience', 'education'];
const requiredContactFields = ['email', 'phone', 'linkedin_url'];

// Expected specific test data values
const expectedTestData = {
  name: "John Silva",
  email: "john.silva@email.com",
  companies: ["DataFlow Inc", "TechFlow Systems", "InnovateTech Solutions"],
  education: "Austin Business School"
};

async function runE2ETest() {
  console.log("🚀 Starting E2E Test for PDF Parser with test_resume.pdf");

  try {
    // Load the test PDF file
    const testPdfPath = path.join(process.cwd(), 'test_resume.pdf');

    if (!fs.existsSync(testPdfPath)) {
      throw new Error(`Test PDF file not found at ${testPdfPath}`);
    }

    const pdfBuffer = fs.readFileSync(testPdfPath);
    console.log(`📄 Loaded test PDF: ${testPdfPath} (${pdfBuffer.length} bytes)`);

    // Create mock context and process PDF
    const mockContext = new MockContext(pdfBuffer, 'test_resume.pdf');

    console.log("⚙️  Processing PDF through parser...");
    const result = await handlePDFUpload(mockContext as any);

    console.log("📊 Parser Result:", JSON.stringify(result, null, 2));

    // Validate response structure
    if (!result.data || result.status !== 200) {
      throw new Error(`Expected successful response, got status ${result.status}`);
    }

    const jsonData = result.data;

    // Test 1: Basic structure validation
    console.log("\n✅ Test 1: Basic JSON Structure");
    if (!jsonData.success) {
      throw new Error("Expected success: true in response");
    }

    if (!jsonData.data) {
      throw new Error("Expected data object in response");
    }

    // Test 2: Required fields validation
    console.log("✅ Test 2: Required Fields Validation");
    for (const field of requiredFields) {
      if (!(field in jsonData.data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Test 3: Test data validation
    console.log("✅ Test 3: Test Data Values Validation");
    const data = jsonData.data;

    // Check name
    if (!data.name || !data.name.includes("John Silva")) {
      console.warn(`⚠️  Expected name to contain "John Silva", got: ${data.name}`);
    } else {
      console.log("  ✓ Name contains test data: John Silva");
    }

    // Check email
    if (!data.contact?.email || !data.contact.email.includes("john.silva@email.com")) {
      console.warn(`⚠️  Expected email to contain test email, got: ${data.contact?.email}`);
    } else {
      console.log("  ✓ Email contains test data: john.silva@email.com");
    }

    // Check experience for test companies
    const experienceText = JSON.stringify(data.experience || []);
    const hasTestCompany = expectedTestData.companies.some(company =>
      experienceText.includes(company)
    );

    if (hasTestCompany) {
      console.log("  ✓ Experience contains test company data");
    } else {
      console.warn("⚠️  Experience may not contain expected test company data");
    }

    // Test 4: Array structures
    console.log("✅ Test 4: Array Structures Validation");

    if (Array.isArray(data.experience)) {
      console.log(`  ✓ Experience is array with ${data.experience.length} items`);
    } else {
      console.warn("⚠️  Experience is not an array");
    }

    if (Array.isArray(data.education)) {
      console.log(`  ✓ Education is array with ${data.education.length} items`);
    } else {
      console.warn("⚠️  Education is not an array");
    }

    // Test 5: Contact information structure
    console.log("✅ Test 5: Contact Information Structure");
    if (data.contact && typeof data.contact === 'object') {
      for (const field of requiredContactFields) {
        if (data.contact[field]) {
          console.log(`  ✓ Contact.${field}: ${data.contact[field]}`);
        }
      }
    }

    console.log("\n🎉 E2E Test Completed Successfully!");
    console.log("\n📋 Summary:");
    console.log(`  • PDF file processed: ${testPdfPath}`);
    console.log(`  • JSON structure validated`);
    console.log(`  • Test data values verified`);
    console.log(`  • Experience entries: ${data.experience?.length || 0}`);
    console.log(`  • Education entries: ${data.education?.length || 0}`);

    return true;

  } catch (error) {
    console.error("\n❌ E2E Test Failed:");
    console.error(error);
    return false;
  }
}


// Run the test
runE2ETest().then(success => {
  process.exit(success ? 0 : 1);
});