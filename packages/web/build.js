// build.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2020'],
  format: 'esm',
  outfile: 'dist/bundle.js',
  loader: { '.js': 'jsx' },
  external: ['vscode'],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).catch(() => process.exit(1));