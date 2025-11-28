import esbuild from 'esbuild';

// Build minified version
esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.min.js',
  format: 'esm',
  platform: 'node',
  target: 'node16',
  minify: true,
  sourcemap: true,
  external: ['pdf-parse'],
  tsconfig: 'tsconfig.json',
}).catch(() => process.exit(1));