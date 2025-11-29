#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parseLinkedInPDF } from '../dist/index.js';

function showUsage() {
  console.error(`
Usage: linkedin-pdf-parser <pdf-file-path> [options]

Arguments:
  <pdf-file-path>     Path to the LinkedIn PDF file to parse

Options:
  --raw-text         Include raw extracted text in output
  --pretty           Pretty-print JSON output (default: true)
  --compact          Compact JSON output (no formatting)
  --help, -h         Show this help message

Examples:
  linkedin-pdf-parser ./resume.pdf
  linkedin-pdf-parser /path/to/linkedin-resume.pdf --raw-text
  linkedin-pdf-parser resume.pdf --compact

Output:
  Outputs structured JSON to stdout with parsed LinkedIn profile data
`);
}

async function main() {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    showUsage();
    process.exit(0);
  }

  // Extract PDF file path (first non-flag argument)
  const pdfPath = args.find(arg => !arg.startsWith('--'));
  if (!pdfPath) {
    console.error('Error: No PDF file path provided');
    showUsage();
    process.exit(1);
  }

  // Parse options
  const options = {
    includeRawText: args.includes('--raw-text'),
    prettyPrint: !args.includes('--compact')
  };

  try {
    // Resolve and validate file path
    const resolvedPath = path.resolve(pdfPath);

    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: File not found: ${resolvedPath}`);
      process.exit(1);
    }

    // Check file extension
    if (!resolvedPath.toLowerCase().endsWith('.pdf')) {
      console.error(`Error: File must be a PDF: ${resolvedPath}`);
      process.exit(1);
    }

    // Read PDF file
    const pdfBuffer = fs.readFileSync(resolvedPath);

    // Parse LinkedIn PDF
    const result = await parseLinkedInPDF(pdfBuffer, {
      includeRawText: options.includeRawText
    });

    // Output JSON to stdout
    if (options.prettyPrint) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(JSON.stringify(result));
    }

  } catch (error) {
    // Output error to stderr
    console.error(`Error: ${error.message}`);

    // Exit with error code
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`Fatal Error: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(`Unhandled Promise Rejection: ${error.message}`);
  process.exit(1);
});

main();