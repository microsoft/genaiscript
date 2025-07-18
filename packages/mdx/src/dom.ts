import { PromptDomNode } from "./types.js";

/**
 * Custom DOM implementation for generating GenAIScript prompts
 */
export class PromptDom {
    private nodes: PromptDomNode[] = [];

    /**
     * Create a custom component for GenAIScript prompts
     */
    private createComponent(tag: string) {
        return (props: Record<string, any> = {}, ...children: any[]) => {
            const node: PromptDomNode = {
                tag,
                props,
                children: this.processChildren(children)
            };
            return node;
        };
    }

    /**
     * Process children nodes
     */
    private processChildren(children: any[]): (PromptDomNode | string)[] {
        return children.flat().map(child => {
            if (typeof child === 'string' || typeof child === 'number') {
                return String(child);
            }
            return child;
        });
    }

    /**
     * Create GenAIScript-specific components following React naming conventions
     */
    getComponents() {
        return {
            // Core GenAIScript components
            System: this.createComponent('system'),
            User: this.createComponent('user'),
            Assistant: this.createComponent('assistant'),
            Def: this.createComponent('def'),
            File: this.createComponent('file'),
            
            // Additional utility components
            Context: this.createComponent('context'),
            Image: this.createComponent('image'),
            
            // Standard HTML elements that might be useful
            div: this.createComponent('div'),
            span: this.createComponent('span'),
            p: this.createComponent('p'),
            h1: this.createComponent('h1'),
            h2: this.createComponent('h2'),
            h3: this.createComponent('h3'),
            h4: this.createComponent('h4'),
            h5: this.createComponent('h5'),
            h6: this.createComponent('h6'),
            ul: this.createComponent('ul'),
            ol: this.createComponent('ol'),
            li: this.createComponent('li'),
            code: this.createComponent('code'),
            pre: this.createComponent('pre'),
            blockquote: this.createComponent('blockquote'),
            em: this.createComponent('em'),
            strong: this.createComponent('strong'),
            br: () => '\n',
            hr: () => '---\n'
        };
    }

    /**
     * Render the DOM tree to GenAIScript format
     */
    renderToString(nodes: (PromptDomNode | string)[]): string {
        return nodes.map(node => this.renderNode(node)).join('');
    }

    /**
     * Render a single node
     */
    private renderNode(node: PromptDomNode | string): string {
        if (typeof node === 'string') {
            return node;
        }

        const { tag, props = {}, children = [] } = node;
        
        switch (tag) {
            case 'system':
                return `$\{system\}\n${this.renderChildren(children)}\n`;
            
            case 'user':
                return `$\{user\}\n${this.renderChildren(children)}\n`;
            
            case 'assistant':
                return `$\{assistant\}\n${this.renderChildren(children)}\n`;
            
            case 'def':
                const name = props.name || 'UNTITLED';
                return `def("${name}", () => {\n${this.renderChildren(children)}\n});\n`;
            
            case 'file':
                const filename = props.name || props.filename;
                if (filename) {
                    return `file("${filename}");\n`;
                }
                return `// File component without name\n${this.renderChildren(children)}\n`;
            
            case 'context':
                return `// Context: ${this.renderChildren(children)}\n`;
            
            case 'image':
                const src = props.src || props.source;
                if (src) {
                    return `defImages("${src}");\n`;
                }
                return `// Image component without source\n`;
            
            case 'code':
                const lang = props.lang || props.language || '';
                const codeContent = this.renderChildren(children);
                return `\`\`\`${lang}\n${codeContent}\n\`\`\`\n`;
            
            case 'pre':
                return `\`\`\`\n${this.renderChildren(children)}\n\`\`\`\n`;
            
            case 'h1':
                return `# ${this.renderChildren(children)}\n\n`;
            
            case 'h2':
                return `## ${this.renderChildren(children)}\n\n`;
            
            case 'h3':
                return `### ${this.renderChildren(children)}\n\n`;
            
            case 'h4':
                return `#### ${this.renderChildren(children)}\n\n`;
            
            case 'h5':
                return `##### ${this.renderChildren(children)}\n\n`;
            
            case 'h6':
                return `###### ${this.renderChildren(children)}\n\n`;
            
            case 'p':
                return `${this.renderChildren(children)}\n\n`;
            
            case 'ul':
                return `${this.renderChildren(children)}\n`;
            
            case 'ol':
                return `${this.renderChildren(children)}\n`;
            
            case 'li':
                return `- ${this.renderChildren(children)}\n`;
            
            case 'blockquote':
                const quoted = this.renderChildren(children)
                    .split('\n')
                    .map(line => `> ${line}`)
                    .join('\n');
                return `${quoted}\n\n`;
            
            case 'em':
                return `*${this.renderChildren(children)}*`;
            
            case 'strong':
                return `**${this.renderChildren(children)}**`;
            
            case 'div':
            case 'span':
            default:
                return this.renderChildren(children);
        }
    }

    /**
     * Render children nodes
     */
    private renderChildren(children: (PromptDomNode | string)[]): string {
        return children.map(child => this.renderNode(child)).join('');
    }
}
