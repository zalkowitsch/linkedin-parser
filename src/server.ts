import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { handlePDFUpload } from './pdf-parser.js';

const app = new Hono();

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>PDF Parser Test</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 600px; margin: 0 auto; }
            .upload-form { padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="file"] { width: 100%; padding: 8px; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .result { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
            .error { background: #f8d7da; color: #721c24; }
            .success { background: #d4edda; color: #155724; }
            pre { background: #f1f1f1; padding: 10px; border-radius: 4px; overflow: auto; max-height: 500px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>PDF Parser Test</h1>
            <div class="upload-form">
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="pdfFile">Select PDF file (Profile.pdf):</label>
                        <input type="file" id="pdfFile" name="pdf" accept=".pdf" required>
                    </div>
                    <button type="submit">Parse PDF</button>
                </form>
            </div>
            <div id="result"></div>
        </div>

        <script>
            document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const fileInput = document.getElementById('pdfFile');
                const file = fileInput.files[0];

                if (!file) {
                    alert('Please select a PDF file');
                    return;
                }

                const formData = new FormData();
                formData.append('pdf', file);

                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '<div class="result">Processing PDF...</div>';

                try {
                    const response = await fetch('/upload', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (response.ok) {
                        resultDiv.innerHTML = \`
                            <div class="result success">
                                <h3>Success!</h3>
                                <pre>\${JSON.stringify(data, null, 2)}</pre>
                            </div>
                        \`;
                    } else {
                        resultDiv.innerHTML = \`
                            <div class="result error">
                                <h3>Error</h3>
                                <p>\${data.error || 'Unknown error occurred'}</p>
                            </div>
                        \`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            <h3>Error</h3>
                            <p>Failed to upload file: \${error.message}</p>
                        </div>
                    \`;
                }
            });
        </script>
    </body>
    </html>
  `);
});

app.post('/upload', handlePDFUpload);

const port = 3000;

console.log(`Starting server on port ${port}...`);
serve({
  fetch: app.fetch,
  port
});

console.log(`Server is running on http://localhost:${port}`);
console.log('Upload your PDF file at the web interface above');