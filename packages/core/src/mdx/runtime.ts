import type { PromptDomNode } from "./types.js";
import { type JSXElement, jsxToPromptDom } from "./jsx-runtime.js";
import { PromptDom } from "./dom.js";

/**
 * MDX Runtime Executor
 * Executes compiled MDX code using a custom JSX factory
 */
export class MdxRuntime {
  private dom: PromptDom;

  constructor() {
    this.dom = new PromptDom();
  }

  /**
   * Execute compiled MDX code and return the rendered result
   */
  async execute(compiledMdx: string, scope: Record<string, any> = {}): Promise<string> {
    try {
      // Create execution context with our JSX runtime and GenAIScript components
      const context = this.createExecutionContext(scope);
      
      // Execute the MDX code in the context
      const result = await this.executeInContext(compiledMdx, context);
      
      // Convert the result to GenAIScript format
      return this.renderResult(result);
    } catch (error) {
      throw new Error(`MDX execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create execution context with JSX runtime and components
   */
  private createExecutionContext(scope: Record<string, any>): Record<string, any> {
    const components = this.dom.getComponents();
    
    return {
      // JSX runtime functions
      jsx: (type: string, props: Record<string, any>) => ({ type, props }),
      jsxs: (type: string, props: Record<string, any>) => ({ type, props }),
      Fragment: (props: { children?: any }) => ({ type: "Fragment", props }),
      
      // React compatibility
      React: {
        createElement: (type: string, props: Record<string, any>, ...children: any[]) => ({
          type,
          props: { ...props, children: children.length === 1 ? children[0] : children }
        }),
        Fragment: (props: { children?: any }) => ({ type: "Fragment", props }),
      },
      
      // MDX components
      _components: components,
      
      // GenAIScript-specific components
      System: components.System,
      User: components.User,
      Assistant: components.Assistant,
      Def: components.Def,
      File: components.File,
      Context: components.Context,
      Image: components.Image,
      
      // Standard HTML elements
      div: components.div,
      span: components.span,
      p: components.p,
      h1: components.h1,
      h2: components.h2,
      h3: components.h3,
      h4: components.h4,
      h5: components.h5,
      h6: components.h6,
      ul: components.ul,
      ol: components.ol,
      li: components.li,
      code: components.code,
      pre: components.pre,
      blockquote: components.blockquote,
      em: components.em,
      strong: components.strong,
      br: components.br,
      hr: components.hr,
      
      // User-provided scope
      ...scope,
      
      // Global objects that might be needed
      console,
      Math,
      Date,
      JSON,
      Object,
      Array,
      String,
      Number,
      Boolean,
    };
  }

  /**
   * Execute MDX code in a sandboxed context
   */
  private async executeInContext(code: string, context: Record<string, any>): Promise<any> {
    // Create a function that executes the MDX code
    // We need to wrap the MDX export in a way that captures the default export
    const wrappedCode = `
      ${code}
      // Try to return the MDX component function
      if (typeof MDXContent !== 'undefined') {
        return MDXContent;
      }
      // If there's a default export, return that
      if (typeof exports !== 'undefined' && exports.default) {
        return exports.default;
      }
      // Return null if no component found
      return null;
    `;

    try {
      // Create an async function with the context as parameters
      const contextKeys = Object.keys(context);
      const contextValues = contextKeys.map(key => context[key]);
      
      const executorFunction = new Function(
        ...contextKeys,
        `const exports = {};
${wrappedCode}`
      );

      // Execute the function with the context values
      const MDXComponent = executorFunction(...contextValues);
      
      if (typeof MDXComponent === 'function') {
        // Execute the MDX component
        const result = MDXComponent({});
        return result;
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to execute MDX: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render the execution result to GenAIScript format
   */
  private renderResult(result: any): string {
    if (result === null || result === undefined) {
      return "";
    }

    if (typeof result === "string") {
      return result;
    }

    // Convert JSX result to PromptDomNode
    let domNode: PromptDomNode | string | null = null;
    
    if (typeof result === "object" && result !== null && "type" in result) {
      domNode = jsxToPromptDom(result as JSXElement);
    } else {
      domNode = String(result);
    }

    if (domNode === null) {
      return "";
    }

    if (typeof domNode === "string") {
      return domNode;
    }

    // Render the DOM node to GenAIScript format
    return this.dom.renderToString([domNode]);
  }

  /**
   * Execute MDX with custom components
   */
  async executeWithComponents(
    compiledMdx: string,
    customComponents: Record<string, any> = {},
    scope: Record<string, any> = {}
  ): Promise<string> {
    const extendedScope = {
      ...scope,
      ...customComponents,
    };
    
    return this.execute(compiledMdx, extendedScope);
  }
}
