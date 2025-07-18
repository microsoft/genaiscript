export { MdxCompiler, compileMdx } from "./compiler.js";
export { PromptDom } from "./dom.js";
export { MdxTransformer } from "./transformer.js";
export type {
  MdxCompilerOptions,
  MdxCompilerResult,
  PromptDomNode,
  SystemProps,
  UserProps,
  AssistantProps,
  DefProps,
  FileProps
} from "./types.js";

// Convenience re-export for easy usage
export { compileMdx as default } from "./compiler.js";
