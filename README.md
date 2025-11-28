# LinkedIn PDF Parser

TypeScript application for parsing PDF resumes/CVs from LinkedIn using Hono framework.

## Features

- Extract text content from LinkedIn PDF exports
- Parse resume information and professional data
- RESTful API built with Hono
- TypeScript support
- Hot reload development

## Installation

```bash
npm install
```

## Usage

### Development

Start the development server with hot reload:

```bash
npm run dev
```

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Production

Run the compiled application:

```bash
npm start
```

### Testing

Run tests:

```bash
npm test
```

## Dependencies

- **Hono**: Fast, lightweight web framework
- **pdf-parse**: PDF text extraction library
- **TypeScript**: Type-safe JavaScript development

## Project Structure

```
src/
├── server.ts       # Main server application
└── pdf-parser.ts   # PDF parsing logic
```

## API Endpoints

The server provides endpoints for:
- Uploading LinkedIn PDF resumes
- Extracting and parsing professional information
- Returning structured resume data