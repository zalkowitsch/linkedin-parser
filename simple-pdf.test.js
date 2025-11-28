const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

describe('PDF Test Suite - John Silva Resume', () => {
  const testPdfPath = path.join(process.cwd(), 'test_resume.pdf');
  let pdfBuffer;
  let extractedText;

  beforeAll(async () => {
    // Carrega o PDF de teste
    if (!fs.existsSync(testPdfPath)) {
      throw new Error(`Arquivo de teste não encontrado: ${testPdfPath}`);
    }
    pdfBuffer = fs.readFileSync(testPdfPath);

    // Extrai o texto
    const pdfData = await pdfParse(pdfBuffer);
    extractedText = pdfData.text;
  });

  describe('Carregamento do PDF', () => {
    test('deve carregar o arquivo PDF com sucesso', () => {
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('deve ter header PDF válido', () => {
      const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });

    test('arquivo deve ter tamanho razoável', () => {
      expect(pdfBuffer.length).toBeGreaterThan(1000); // Pelo menos 1KB
      expect(pdfBuffer.length).toBeLessThan(10000000); // Menos de 10MB
    });
  });

  describe('Extração de Texto', () => {
    test('deve extrair texto do PDF', () => {
      expect(extractedText).toBeDefined();
      expect(typeof extractedText).toBe('string');
      expect(extractedText.length).toBeGreaterThan(100);
    });

    test('deve ter quantidade razoável de texto', () => {
      expect(extractedText.length).toBeGreaterThan(1000);
      console.log(`✅ Texto extraído: ${extractedText.length} caracteres`);
    });
  });

  describe('Validação dos Dados de Teste', () => {
    test('deve conter o nome de teste "John Silva"', () => {
      expect(extractedText).toContain('John Silva');
    });

    test('deve conter o email de teste', () => {
      expect(extractedText).toContain('john.silva@email.com');
    });

    test('deve conter pelo menos uma empresa de teste', () => {
      const testCompanies = ['DataFlow Inc', 'TechFlow Systems', 'TechCorp'];
      const hasTestCompany = testCompanies.some(company =>
        extractedText.includes(company)
      );
      expect(hasTestCompany).toBe(true);
    });

    test('deve conter informações educacionais de teste', () => {
      const educationTerms = ['Austin Business School', 'Business', 'School', 'University'];
      const hasEducation = educationTerms.some(term =>
        extractedText.includes(term)
      );
      expect(hasEducation).toBe(true);
    });

    test('deve conter LinkedIn profile', () => {
      expect(extractedText).toMatch(/linkedin\.com/i);
    });

    test('deve conter informações de idiomas', () => {
      const languages = ['English', 'Spanish', 'Portuguese'];
      const hasLanguages = languages.some(lang =>
        extractedText.includes(lang)
      );
      expect(hasLanguages).toBe(true);
    });
  });

  describe('Estrutura de Dados', () => {
    test('deve conter seções esperadas', () => {
      const sections = ['Contact', 'Summary', 'Experience', 'Education'];
      sections.forEach(section => {
        expect(extractedText).toMatch(new RegExp(section, 'i'));
      });
    });

    test('deve ter localização mencionada', () => {
      const locations = ['New York', 'Austin', 'TX'];
      const hasLocation = locations.some(loc =>
        extractedText.includes(loc)
      );
      expect(hasLocation).toBe(true);
    });
  });

  describe('Qualidade dos Dados', () => {
    test('não deve conter dados pessoais reais', () => {
      // Verificar se não tem mais dados do Arkady
      expect(extractedText).not.toContain('Arkady');
      expect(extractedText).not.toContain('arkadyzalko@gmail.com');
    });

    test('deve ter substituído empresas reais por dados de teste', () => {
      const realCompanies = ['Carta', 'Partiu Vantagens!', 'Zestt'];
      const hasRealCompany = realCompanies.some(company =>
        extractedText.includes(company)
      );
      expect(hasRealCompany).toBe(false);
    });

    test('deve conter principalmente dados fictícios', () => {
      expect(extractedText).toContain('John Silva');
      expect(extractedText).toContain('john.silva@email.com');
    });
  });

  describe('Performance e Estrutura', () => {
    test('extração deve ser rápida', async () => {
      const startTime = Date.now();
      await pdfParse(pdfBuffer);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // Menos de 3 segundos
    });

    test('texto deve ter estrutura JSON-friendly', () => {
      // Verificar se tem caracteres básicos para parsing
      expect(extractedText).toMatch(/\w+/); // Pelo menos palavras
      expect(extractedText).toMatch(/\s+/); // Espaços
      expect(extractedText).toMatch(/[a-zA-Z]+/); // Letras
    });
  });
});