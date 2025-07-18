import { WorkspaceFile } from "@genaiscript/core";
import { MdxTransformer } from "./transformer.js";
import { MdxCompilerOptions, MdxCompilerResult } from "./types.js";

/**
 * Main MDX compiler class that integrates with GenAIScript
 */
export class MdxCompiler {
    private transformer: MdxTransformer;

    constructor() {
        this.transformer = new MdxTransformer();
    }

    /**
     * Compile a WorkspaceFile containing MDX content to GenAIScript format
     */
    async compileFile(
        file: WorkspaceFile, 
        options: MdxCompilerOptions = {}
    ): Promise<MdxCompilerResult> {
        if (typeof file.content !== 'string') {
            throw new Error('File content must be a string');
        }

        // Validate file type
        if (!this.isMdxFile(file.filename)) {
            return {
                content: file.content,
                messages: [{
                    type: "warning",
                    message: `File ${file.filename} does not appear to be an MDX file`
                }]
            };
        }

        return await this.transformer.transform(file.content, options);
    }

    /**
     * Compile MDX content from a string
     */
    async compile(
        content: string, 
        options: MdxCompilerOptions = {}
    ): Promise<MdxCompilerResult> {
        return await this.transformer.transform(content, options);
    }

    /**
     * Generate a .genai.mts filename from an MDX filename
     */
    generateOutputFilename(inputFilename: string, typescript = true): string {
        const baseName = inputFilename.replace(/\.mdx?$/i, '');
        const extension = typescript ? '.genai.mts' : '.genai.mjs';
        return baseName + extension;
    }

    /**
     * Check if a file is an MDX file based on extension
     */
    private isMdxFile(filename: string): boolean {
        return /\.mdx?$/i.test(filename);
    }

    /**
     * Batch compile multiple MDX files
     */
    async compileFiles(
        files: WorkspaceFile[], 
        options: MdxCompilerOptions = {}
    ): Promise<Array<{ file: WorkspaceFile; result: MdxCompilerResult }>> {
        const results = await Promise.all(
            files.map(async (file) => ({
                file,
                result: await this.compileFile(file, options)
            }))
        );

        return results;
    }

    /**
     * Create a GenAIScript PromptScript from compiled MDX
     */
    createPromptScript(
        result: MdxCompilerResult,
        metadata: {
            id?: string;
            title?: string;
            description?: string;
        } = {}
    ): any {
        // Extract any script configuration from the compiled content
        const lines = result.content.split('\n');
        const config: any = {};
        const scriptLines: string[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Extract configuration lines
            if (trimmed.startsWith('model:')) {
                config.model = trimmed.substring(6).trim().replace(/"/g, '');
            } else if (trimmed.startsWith('temperature:')) {
                config.temperature = parseFloat(trimmed.substring(12).trim());
            } else if (trimmed.startsWith('maxTokens:')) {
                config.maxTokens = parseInt(trimmed.substring(10).trim());
            } else if (trimmed.startsWith('system:')) {
                config.system = trimmed.substring(7).trim().replace(/`/g, '');
            } else if (!trimmed.startsWith('//')) {
                // Keep non-comment lines as script content
                scriptLines.push(line);
            }
        }

        return {
            id: metadata.id || 'mdx-generated',
            title: metadata.title || 'Generated from MDX',
            description: metadata.description || 'Auto-generated from MDX file',
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            system: config.system,
            script: scriptLines.join('\n').trim()
        };
    }
}

/**
 * Convenience function to compile MDX content to GenAIScript
 */
export async function compileMdx(
    file: WorkspaceFile,
    options?: MdxCompilerOptions
): Promise<MdxCompilerResult> {
    const compiler = new MdxCompiler();
    return compiler.compileFile(file, options);
}
