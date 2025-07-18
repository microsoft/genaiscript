import type { CompileOptions } from "@mdx-js/mdx";
import type { WorkspaceFile, PromptScript } from "../types.js";

export interface MdxCompilerOptions {
  /**
   * Output directory for compiled files
   */
  outputDir?: string;

  /**
   * MDX compilation options
   */
  mdxOptions?: CompileOptions;
}

export interface MdxCompilerResult {
  /**
   * Generated GenAIScript content
   */
  content: string;

  /**
   * Any compilation messages
   */
  messages: Array<{
    type: "error" | "warning" | "info";
    message: string;
  }>;
}

/**
 * Custom DOM node types for GenAIScript prompt generation
 */
export interface PromptDomNode {
  tag: string;
  props?: Record<string, any>;
  children?: (PromptDomNode | string)[];
}

export interface SystemMessageNode extends PromptDomNode {
  type: "element";
  name: "System";
}

export interface UserMessageNode extends PromptDomNode {
  type: "element";
  name: "User";
}

export interface AssistantMessageNode extends PromptDomNode {
  type: "element";
  name: "Assistant";
}

export interface DefVariableNode extends PromptDomNode {
  type: "element";
  name: "Def";
  attributes: {
    name: string;
    value?: any;
    options?: Record<string, any>;
  };
}

export { WorkspaceFile, PromptScript };

// React naming conventions for GenAIScript components
export interface SystemProps {
  children?: any;
}

export interface UserProps {
  children?: any;
}

export interface AssistantProps {
  children?: any;
}

export interface DefProps {
  name: string;
  children?: any;
}
