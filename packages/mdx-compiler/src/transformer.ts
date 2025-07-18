import { VFile } from "vfile";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import { compile } from "@mdx-js/mdx";
import { parse as parseYaml } from "yaml";
import { PromptDom } from "./dom.js";
import { MdxCompilerOptions, MdxCompilerResult } from "./types.js";

/**
 * Transforms MDX content into GenAIScript format
 */
export class MdxTransformer {
    private dom: PromptDom;

    constructor() {
        this.dom = new PromptDom();
    }

    /**
     * Extract frontmatter from MDX content
     */
    private extractFrontmatter(content: string): { frontmatter: any; content: string } {
        const processor = unified()
            .use(remarkParse)
            .use(remarkFrontmatter, ['yaml']);

        const file = new VFile(content);
        const tree = processor.parse(file);
        
        let frontmatter = {};
        let cleanContent = content;

        // Extract YAML frontmatter
        if (tree.children && tree.children.length > 0 && (tree.children[0] as any).type === 'yaml') {
            const yamlNode = tree.children[0] as any;
            try {
                frontmatter = parseYaml(yamlNode.value) || {};
                // Remove frontmatter from content
                const lines = content.split('\n');
                let startLine = 0;
                let endLine = 0;
                
                if (lines[0] === '---') {
                    startLine = 0;
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i] === '---') {
                            endLine = i;
                            break;
                        }
                    }
                    if (endLine > 0) {
                        cleanContent = lines.slice(endLine + 1).join('\n').trimStart();
                    }
                }
            } catch (error) {
                // If YAML parsing fails, keep original content
                console.warn('Failed to parse frontmatter:', error);
            }
        }

        return { frontmatter, content: cleanContent };
    }

    /**
     * Generate GenAIScript preamble from frontmatter
     */
    private generatePreamble(frontmatter: any): string {
        const lines: string[] = [];
        
        if (frontmatter.title) {
            lines.push(`// ${frontmatter.title}`);
        }
        
        if (frontmatter.description) {
            lines.push(`// ${frontmatter.description}`);
        }
        
        if (frontmatter.model) {
            lines.push(`model: "${frontmatter.model}"`);
        }
        
        if (frontmatter.temperature !== undefined) {
            lines.push(`temperature: ${frontmatter.temperature}`);
        }
        
        if (frontmatter.maxTokens) {
            lines.push(`maxTokens: ${frontmatter.maxTokens}`);
        }
        
        if (frontmatter.system) {
            lines.push(`system: \`${frontmatter.system}\``);
        }
        
        if (frontmatter.files && Array.isArray(frontmatter.files)) {
            frontmatter.files.forEach((file: string) => {
                lines.push(`def("file_${file.replace(/[^a-zA-Z0-9]/g, '_')}", () => file("${file}"));`);
            });
        }
        
        if (frontmatter.images && Array.isArray(frontmatter.images)) {
            frontmatter.images.forEach((image: string) => {
                lines.push(`defImages("${image}");`);
            });
        }
        
        if (lines.length > 0) {
            lines.push(''); // Add empty line after preamble
        }
        
        return lines.join('\n');
    }

    /**
     * Transform MDX to GenAIScript
     */
    async transform(content: string, options: MdxCompilerOptions = {}): Promise<MdxCompilerResult> {
        const messages: Array<{ type: "error" | "warning" | "info"; message: string }> = [];
        
        try {
            // Extract frontmatter
            const { frontmatter, content: mdxContent } = this.extractFrontmatter(content);
            
            // Generate preamble from frontmatter
            const preamble = this.generatePreamble(frontmatter);
            
            // Prepare MDX compilation options
            const compileOptions = {
                jsxImportSource: '@mdx-js/react',
                ...options.mdxOptions,
                development: false
            };
            
            // Create a compiled version  
            const compiledMdx = String(await compile(mdxContent, compileOptions));
            
            // For now, generate a simple GenAIScript structure
            // In a real implementation, we would need to execute the MDX runtime
            // and capture the resulting virtual DOM structure
            
            const genaiContent = `${preamble}
// Generated from MDX

${this.convertMdxToGenaiScript(mdxContent)}
`;
            
            return {
                content: genaiContent,
                messages
            };
            
        } catch (error) {
            messages.push({
                type: "error",
                message: error instanceof Error ? error.message : String(error)
            });
            
            return {
                content: `// Error compiling MDX: ${error}`,
                messages
            };
        }
    }

    /**
     * Simple MDX to GenAIScript conversion
     * This is a simplified approach - in production you'd want to 
     * actually execute the MDX and capture the virtual DOM
     */
    private convertMdxToGenaiScript(mdxContent: string): string {
        // Simple regex-based conversion for basic cases
        let content = mdxContent;
        
        // Convert JSX-style components to GenAIScript calls
        content = content.replace(/<System>(.*?)<\/System>/gs, (_, inner) => {
            return `\${system}\n${inner.trim()}\n`;
        });
        
        content = content.replace(/<User>(.*?)<\/User>/gs, (_, inner) => {
            return `\${user}\n${inner.trim()}\n`;
        });
        
        content = content.replace(/<Assistant>(.*?)<\/Assistant>/gs, (_, inner) => {
            return `\${assistant}\n${inner.trim()}\n`;
        });
        
        content = content.replace(/<Def name="([^"]*)">(.*?)<\/Def>/gs, (_, name, inner) => {
            return `def("${name}", () => {\n${inner.trim()}\n});\n`;
        });
        
        content = content.replace(/<File name="([^"]*)"\\s*\/>/g, (_, name) => {
            return `file("${name}");\n`;
        });
        
        content = content.replace(/<File name="([^"]*)">(.*?)<\/File>/gs, (_, name, inner) => {
            return `file("${name}");\n${inner.trim()}\n`;
        });
        
        return content;
    }
}
