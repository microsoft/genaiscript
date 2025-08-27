const ts = require('typescript');
const fs = require('fs');

// Read the file
const fileName = 'src/fragmentcommands.ts';
const sourceCode = fs.readFileSync(fileName, 'utf8');

// Simple syntax check
const result = ts.transpileModule(sourceCode, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    skipLibCheck: true,
    noEmit: true
  }
});

if (result.diagnostics && result.diagnostics.length > 0) {
  console.log('TypeScript errors found:');
  result.diagnostics.forEach(diagnostic => {
    console.log(diagnostic.messageText);
  });
  process.exit(1);
} else {
  console.log('✅ TypeScript syntax check passed for fragmentcommands.ts');
}
