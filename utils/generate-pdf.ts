#!/usr/bin/env node
/**
 * Script para gerar um PDF de teste com estrutura similar ao Profile.pdf
 * usando Node.js e Puppeteer ou Chrome headless.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const HTML_FILE = join(process.cwd(), 'test_resume.html');
const PDF_FILE = join(process.cwd(), 'test_resume.pdf');

// Possíveis caminhos do Chrome no macOS, Linux e Windows
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
  '/Applications/Chromium.app/Contents/MacOS/Chromium', // macOS Chromium
  'google-chrome', // Linux
  'chromium', // Linux
  'chromium-browser', // Linux
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows x86
];

async function findChrome(): Promise<string | null> {
  for (const path of CHROME_PATHS) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Tenta os comandos que podem estar no PATH
  for (const cmd of ['google-chrome', 'chromium', 'chromium-browser']) {
    try {
      const result = await runCommand('which', [cmd]);
      if (result.success) {
        return cmd;
      }
    } catch {
      // Ignore e continue
    }
  }

  return null;
}

interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

function runCommand(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'pipe' });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    child.on('error', (error) => {
      resolve({
        success: false,
        stdout: '',
        stderr: error.message
      });
    });
  });
}

async function htmlToPdfChrome(): Promise<boolean> {
  console.log('🔍 Procurando pelo Chrome/Chromium...');

  const chromePath = await findChrome();
  if (!chromePath) {
    console.log('❌ Chrome/Chromium não encontrado no sistema');
    return false;
  }

  console.log(`✅ Chrome encontrado: ${chromePath}`);
  console.log('🔄 Convertendo HTML para PDF...');

  const args = [
    '--headless',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    `--print-to-pdf=${PDF_FILE}`,
    '--print-to-pdf-no-header',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=2000',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-extensions',
    '--disable-web-security',
    `file://${HTML_FILE}`
  ];

  const result = await runCommand(chromePath, args);

  if (result.success) {
    console.log(`✅ PDF gerado com sucesso: ${PDF_FILE}`);
    return true;
  } else {
    console.log(`❌ Erro ao gerar PDF: ${result.stderr || 'Erro desconhecido'}`);
    return false;
  }
}

async function main(): Promise<boolean> {
  console.log('📄 Gerando PDF de teste com dados fictícios...');
  console.log('');

  // Verifica se o arquivo HTML existe
  if (!existsSync(HTML_FILE)) {
    console.log(`❌ Arquivo HTML não encontrado: ${HTML_FILE}`);
    console.log('💡 Certifique-se de que o arquivo test_resume.html existe na raiz do projeto.');
    return false;
  }

  console.log(`📂 Arquivo HTML encontrado: ${HTML_FILE}`);

  // Tenta converter usando Chrome
  if (await htmlToPdfChrome()) {
    console.log('');
    console.log('🎉 PDF gerado com sucesso!');
    console.log(`📁 Arquivo criado: ${PDF_FILE}`);
    return true;
  }

  console.log('');
  console.log('❌ Não foi possível gerar o PDF automaticamente.');
  console.log('');
  console.log('💡 Alternativas:');
  console.log('   1. Instale o Google Chrome ou Chromium');
  console.log('   2. Abra test_resume.html em um navegador');
  console.log('   3. Use "Imprimir > Salvar como PDF" para criar manualmente');
  console.log('');
  console.log('📦 Ou instale o Puppeteer para conversão automática:');
  console.log('   npm install puppeteer-core');

  return false;
}

// Executa apenas se chamado diretamente (ES module check)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  main().catch((error) => {
    console.error('💥 Erro inesperado:', error.message);
    process.exit(1);
  });
}

export { main as generatePDF };