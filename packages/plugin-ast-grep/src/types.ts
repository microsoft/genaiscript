// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type {
  DiffFile,
  ElementOrArray,
  FindFilesOptions,
  OptionsOrString,
  WorkspaceFile,
} from "@genaiscript/core";
import type { Edit, Range, Rule, Pos, SgNode, SgRoot, NapiConfig } from "@ast-grep/napi";
import type {
  PatternStyle,
  PatternObject,
  Strictness,
  Relation,
} from "@ast-grep/napi/types/rule.js";

export type SgEdit = Edit;
export type SgPos = Pos;
export type SgRange = Range;
export type SgMatcher = NapiConfig;
export type SgStrictness = Strictness;
export type SgPatternObject = PatternObject;
export type SgPatternStyle = PatternStyle;
export type SgRule = Rule;
export type SgRelation = Relation;

export { SgNode, SgRoot };

export type SgLang = OptionsOrString<
  | "html"
  | "js"
  | "javascript"
  | "ts"
  | "typescript"
  | "tsx"
  | "css"
  | "c"
  | "sql"
  | "angular"
  | "csharp"
  | "python"
  | "rust"
  | "elixir"
  | "haskell"
  | "go"
  | "dart"
  | "swift"
  | "scala"
>;

export interface SgChangeSet {
  count: number;
  replace(node: SgNode, text: string): SgEdit;
  commit(): WorkspaceFile[];
}

export interface SgSearchOptions extends Omit<FindFilesOptions, "readText"> {
  /**
   * Restrict matches that are part of the diff.
   */
  diff?: string | ElementOrArray<DiffFile>;
}

export interface Sg {
  /**
   * Create a change set
   */
  changeset(): SgChangeSet;
  parse(file: WorkspaceFile, options?: { lang?: SgLang }): Promise<SgRoot>;
  search(
    lang: SgLang,
    glob: ElementOrArray<string>,
    matcher: string | SgMatcher,
    options?: SgSearchOptions,
  ): Promise<{
    /**
     * Number of files found
     */
    files: number;
    /**
     * Each individual file matches as a node
     */
    matches: SgNode[];
  }>;
}
