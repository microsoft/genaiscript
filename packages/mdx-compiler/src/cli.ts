import { MDXCompiler } from "./compiler.js";
import { join, dirname } from "path";
import { promises as fs } from "fs";

interface CLIOptions {
  input?: string;
  output?: string;
  watch?: boolean;
  typescript?: boolean;
  help?: boolean;
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-i':
      case '--input':
        if (i + 1 < args.length) {
          options.input = args[++i];
        }
        break;
      case '-o':
      case '--output':
        if (i + 1 < args.length) {
          options.output = args[++i];
        }
        break;
      case '-w':
      case '--watch':
        options.watch = true;
        break;
      case '-t':
      case '--typescript':
        options.typescript = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
MDX to GenAIScript Compiler

Usage: mdx-compiler [options]

Options:
  -i, --input <path>     Input file or directory (default: current directory)
  -o, --output <path>    Output directory (default: ./dist)
  -w, --watch           Watch for changes and recompile
  -t, --typescript      Generate TypeScript files (.genai.mts)
  -h, --help            Show this help message

Examples:
  mdx-compiler -i src -o dist
  mdx-compiler -i example.genai.mdx -o output.genai.mts
  mdx-compiler -w -i src -o dist
`);
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  if (options.help) {
    showHelp();
    return;
  }
  
  const inputPath = options.input || process.cwd();
  const outputPath = options.output || "./dist";
  
  const compiler = new MDXCompiler({
    typescript: options.typescript,
    outputDir: outputPath
  });
  
  try {
    const stats = await fs.stat(inputPath);
    
    if (stats.isFile()) {
      // Compile single file
      const result = await compiler.compileFile(inputPath, outputPath);
      
      if (result.messages.length > 0) {
        for (const message of result.messages) {
          console.log(`${message.type}: ${message.message}`);
        }
      } else {
        console.log(`✓ Compiled ${inputPath} -> ${outputPath}`);
      }
      
      if (options.watch) {
        console.log(`Watching ${inputPath} for changes...`);
        const { watch } = await import("fs");
        watch(inputPath, async () => {
          console.log(`Recompiling ${inputPath}...`);
          const result = await compiler.compileFile(inputPath, outputPath);
          
          if (result.messages.length > 0) {
            for (const message of result.messages) {
              console.log(`${message.type}: ${message.message}`);
            }
          } else {
            console.log(`✓ Recompiled ${inputPath} -> ${outputPath}`);
          }
        });
      }
    } else {
      // Compile directory
      if (options.watch) {
        await compiler.watch(inputPath, outputPath);
      } else {
        const results = await compiler.compileDirectory(inputPath, outputPath);
        
        for (const { file, result } of results) {
          if (result.messages.length > 0) {
            for (const message of result.messages) {
              console.log(`${file}: ${message.type}: ${message.message}`);
            }
          } else {
            console.log(`✓ Compiled ${file}`);
          }
        }
        
        console.log(`Compiled ${results.length} files to ${outputPath}`);
      }
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
