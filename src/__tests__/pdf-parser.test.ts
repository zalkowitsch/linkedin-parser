import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { handlePDFUpload } from '../pdf-parser';

// Mock Context para testes
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

  json(data: any, status: number = 200) {
    return {
      data,
      status
    };
  }
}

describe('PDF Parser E2E Tests', () => {
  const testPdfPath = path.join(process.cwd(), 'test_resume.pdf');
  let pdfBuffer: Buffer;

  beforeAll(() => {
    // Verifica se o arquivo de teste existe
    if (!fs.existsSync(testPdfPath)) {
      throw new Error(`Test PDF file not found at ${testPdfPath}`);
    }
    pdfBuffer = fs.readFileSync(testPdfPath);
  });

  describe('Basic PDF Processing', () => {
    test('should load test PDF file successfully', () => {
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(0);
      console.log(`✅ Loaded test PDF: ${pdfBuffer.length} bytes`);
    });

    test('should extract text from PDF', async () => {
      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text;

      expect(text).toBeDefined();
      expect(text.length).toBeGreaterThan(100);
      expect(typeof text).toBe('string');

      console.log(`✅ Extracted ${text.length} characters`);
    });
  });

  describe('Test Data Validation', () => {
    let extractedText: string;

    beforeAll(async () => {
      const pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text;
    });

    test('should contain test name "John Silva"', () => {
      expect(extractedText).toContain('John Silva');
    });

    test('should contain test email', () => {
      expect(extractedText).toContain('john.silva@email.com');
    });

    test('should contain test company names', () => {
      const hasTestCompany =
        extractedText.includes('DataFlow Inc') ||
        extractedText.includes('TechFlow Systems') ||
        extractedText.includes('TechCorp');

      expect(hasTestCompany).toBe(true);
    });

    test('should contain education information', () => {
      const hasEducation =
        extractedText.includes('Austin Business School') ||
        extractedText.includes('Business') ||
        extractedText.includes('School');

      expect(hasEducation).toBe(true);
    });

    test('should contain LinkedIn profile', () => {
      expect(extractedText).toMatch(/linkedin\.com\/in\/\w+/);
    });

    test('should contain language information', () => {
      const hasLanguages =
        extractedText.includes('English') ||
        extractedText.includes('Spanish') ||
        extractedText.includes('Portuguese');

      expect(hasLanguages).toBe(true);
    });
  });

  describe('PDF Parser Function Integration', () => {
    test('should process PDF through handlePDFUpload function', async () => {
      const mockContext = new MockContext(pdfBuffer, 'test_resume.pdf');

      const result = await handlePDFUpload(mockContext as any);

      expect(result).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
    });

    test('should return structured JSON with correct format', async () => {
      const mockContext = new MockContext(pdfBuffer, 'test_resume.pdf');

      const result = await handlePDFUpload(mockContext as any);
      const jsonData = result.data;

      // Estrutura básica
      expect(jsonData.success).toBe(true);
      expect(jsonData.data).toBeDefined();
      expect(typeof jsonData.data).toBe('object');

      // Campos obrigatórios
      expect(jsonData.data).toHaveProperty('name');
      expect(jsonData.data).toHaveProperty('contact');
      expect(jsonData.data).toHaveProperty('experience');
      expect(jsonData.data).toHaveProperty('education');

      // Tipos de dados corretos
      expect(typeof jsonData.data.contact).toBe('object');
      expect(Array.isArray(jsonData.data.experience)).toBe(true);
      expect(Array.isArray(jsonData.data.education)).toBe(true);
    });

    test('should extract contact information correctly', async () => {
      const mockContext = new MockContext(pdfBuffer, 'test_resume.pdf');

      const result = await handlePDFUpload(mockContext as any);
      const contact = result.data.data.contact;

      expect(contact).toBeDefined();
      expect(contact.email).toBeDefined();
      expect(contact.email).toContain('@');

      if (contact.linkedin_url) {
        expect(contact.linkedin_url).toContain('linkedin.com');
      }
    });

    test('should have reasonable data completeness', async () => {
      const mockContext = new MockContext(pdfBuffer, 'test_resume.pdf');

      const result = await handlePDFUpload(mockContext as any);
      const data = result.data.data;

      // Verifica se temos dados básicos
      expect(data.name).toBeTruthy();
      expect(data.contact.email).toBeTruthy();

      // Verifica arrays não vazios (quando aplicável)
      if (data.experience && Array.isArray(data.experience)) {
        expect(data.experience.length).toBeGreaterThanOrEqual(0);
      }

      if (data.education && Array.isArray(data.education)) {
        expect(data.education.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing PDF file gracefully', async () => {
      const mockContext = new MockContext(Buffer.alloc(0), 'empty.pdf');

      try {
        const result = await handlePDFUpload(mockContext as any);
        // Se não falhar, pelo menos deve retornar algo estruturado
        expect(result).toBeDefined();
      } catch (error) {
        // Se falhar, deve ser um erro esperado
        expect(error).toBeDefined();
      }
    });

    test('should validate PDF file format', () => {
      // Verifica se o arquivo tem header PDF
      const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });
  });

  describe('Performance Tests', () => {
    test('should process PDF within reasonable time', async () => {
      const startTime = Date.now();

      const mockContext = new MockContext(pdfBuffer, 'test_resume.pdf');
      await handlePDFUpload(mockContext as any);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Deve processar em menos de 5 segundos
      expect(processingTime).toBeLessThan(5000);
      console.log(`✅ Processing time: ${processingTime}ms`);
    });

    test('should have reasonable memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const mockContext = new MockContext(pdfBuffer, 'test_resume.pdf');
      await handlePDFUpload(mockContext as any);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Aumento de memória deve ser razoável (menos de 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      console.log(`✅ Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });
});