// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import {
  CancelError,
  checkCancelled,
  checkRuntime,
  diffFindChunk,
  diffResolve,
  errorMessage,
  genaiscriptDebug,
  host,
  resolveFileContent,
} from "@genaiscript/core";
import type { CancellationOptions, ElementOrArray, WorkspaceFile } from "@genaiscript/core";
import type {
  Sg,
  SgChangeSet,
  SgEdit,
  SgLang,
  SgMatcher,
  SgNode,
  SgRoot,
  SgSearchOptions,
} from "./types.js";
import { extname } from "path";

const dbg = genaiscriptDebug("astgrep");
const dbgLang = dbg.extend("lang");

class SgChangeSetImpl implements SgChangeSet {
  private pending: Record<string, { root: SgRoot; edits: SgEdit[] }> = {};

  toString() {
    return `changeset ${this.count} edits`;
  }

  get count(): number {
    return Object.values(this.pending).reduce((acc, { edits }) => acc + edits.length, 0);
  }

  replace(node: SgNode, text: string) {
    const edit = node.replace(text);
    const root = node.getRoot();
    let rootEdits = this.pending[root.filename()];
    if (rootEdits) {
      if (rootEdits.root !== root) {
        throw new Error(
          `node ${node} belongs to a different root ${root} than the pending edits ${rootEdits.root}`,
        );
      }
    } else rootEdits = this.pending[root.filename()] = { root, edits: [] };
    rootEdits.edits.push(edit);
    return edit;
  }
  commit() {
    const files: WorkspaceFile[] = [];
    for (const { root, edits } of Object.values(this.pending)) {
      const filename = root.filename();
      const content = root.root().commitEdits(edits);
      files.push({ filename, content });
    }
    return files;
  }
}

/**
 * Creates an instance of a change set for managing and committing AST node edits.
 *
 * This function initializes an empty change set, which can be used for tracking edits
 * to AST nodes, associating them with their corresponding file roots, and committing
 * the changes back to files.
 *
 * @returns A new change set instance to handle AST edits.
 */
function astGrepCreateChangeSet(): SgChangeSet {
  return new SgChangeSetImpl();
}

/**
 * Searches for files matching specific criteria based on file patterns and match rules,
 * and performs analysis or modifications on matched nodes in the files.
 *
 * @param lang - The language of the files to search, such as JavaScript or HTML.
 * @param glob - A single or array of glob patterns to match file paths.
 * @param matcher - The match criteria, either a string pattern or a specific matcher object.
 * @param options - Optional parameters, including cancellation options and options for file search.
 *   - cancellationToken: A token to handle operation interruptions.
 *   - diff: A diff object to filter files based on changes.
 *
 * @returns An object containing:
 * - `files`: The number of files scanned.
 * - `matches`: The list of matched nodes.
 *
 * @throws An error if `glob` or `matcher` is not provided.
 */
async function astGrepFindFiles(
  lang: SgLang,
  glob: ElementOrArray<string>,
  matcher: string | SgMatcher,
  options?: SgSearchOptions & CancellationOptions,
): ReturnType<Sg["search"]> {
  const { cancellationToken, diff } = options || {};
  if (!glob) {
    throw new Error("glob is required");
  }
  if (!matcher) {
    throw new Error("matcher is required");
  }
  const diffFiles = diffResolve(diff);

  dbg(`search %O`, matcher);
  if (diffFiles?.length) dbg(`diff files: ${diffFiles.length}`);

  checkCancelled(cancellationToken);

  let paths = await host.findFiles(glob, options);
  if (!paths?.length) {
    dbg(`no files found for glob`, glob);
    return {
      files: 0,
      matches: [],
    };
  }
  dbg(`found ${paths.length} files`, paths);

  if (diffFiles?.length) {
    const diffFilesSet = new Set(diffFiles.filter((f) => f.to).map((f) => f.to));
    paths = paths.filter((p) => diffFilesSet.has(p));
    dbg(`filtered files by diff: ${paths.length}`);
    if (!paths?.length) {
      return {
        files: 0,
        matches: [],
      };
    }
  }

  const { findInFiles } = await import("@ast-grep/napi");
  let matches: SgNode[] = [];
  // eslint-disable-next-line no-async-promise-executor
  const p = new Promise<number>(async (resolve, reject) => {
    let i = 0;
    let n: number = undefined;
    const sglang = await resolveLang(lang);
    n = await findInFiles(
      sglang,
      {
        paths,
        matcher: typeof matcher === "string" ? <SgMatcher>{ rule: { pattern: matcher } } : matcher,
      },
      (err, nodes) => {
        if (err) {
          dbg(`error occurred: ${err}`);
          throw err;
        }
        dbg(`nodes found: ${nodes.length}`);
        matches.push(...nodes);
        if (cancellationToken?.isCancellationRequested) {
          reject(new CancelError("cancelled"));
        }
        if (++i === n) {
          dbg(`resolving promise with count: ${n}`);
          resolve(n);
        }
      },
    );
    if (n === i) {
      dbg("resolving promise as callbacks might be ahead");
      // we might be ahead of the callbacks
      resolve(n);
    }
  });
  const scanned = await p;
  dbg(`files scanned: ${scanned}, matches found: ${matches.length}`);
  checkCancelled(cancellationToken);

  // apply diff
  if (diffFiles?.length) {
    matches = matches.filter((m) => {
      const range: [number, number] = [m.range().start.line, m.range().end.line];
      const { chunk } = diffFindChunk(m.getRoot().filename(), range, diffFiles) || {};
      if (chunk) {
        dbg(
          `diff overlap at (${range[0]},${range[1]}) x (${chunk.newStart},${chunk.newStart + chunk.newLines})`,
        );
      }
      return chunk;
    });
    dbg(`matches filtered by diff: ${matches.length}`);
  }

  return { files: scanned, matches };
}

/**
 * Parses a given file into an abstract syntax tree (AST) root node.
 *
 * @param file - The input file to parse. Must include filename, encoding, and content properties.
 * @param options - Optional parameters:
 *   - lang: Specifies the programming or markup language for parsing. If not provided, attempts to infer from the file name.
 *   - cancellationToken: Optional cancellation token to abort the operation if necessary.
 *
 * @returns The parsed AST root node. Returns undefined if the file is binary or language cannot be resolved.
 *
 * Notes:
 * - Skips binary files based on the `encoding` property.
 * - Automatically resolves file content before parsing.
 * - Uses the library "@ast-grep/napi" for parsing.
 */
async function astGrepParse(
  file: WorkspaceFile,
  options?: { lang?: SgLang | Record<string, SgLang> } & CancellationOptions,
): Promise<SgRoot> {
  const { cancellationToken } = options || {};
  if (file.encoding) {
    dbg("ignore binary file");
    return undefined;
  } // binary file

  await resolveFileContent(file);
  checkCancelled(cancellationToken);
  const { parseAsync } = await import("@ast-grep/napi");
  const { filename, encoding, content } = file;
  if (encoding) {
    dbg("ignore binary file");
    return undefined;
  } // binary file

  dbg(`parsing file: ${filename}`);
  const lang = await resolveLang(options?.lang, filename);
  if (!lang) {
    return undefined;
  }
  dbg("parsing file content");
  const root = await parseAsync(lang, content);
  checkCancelled(cancellationToken);
  return root;
}

async function resolveLang(lang: SgLang | Record<string, SgLang>, filename?: string) {
  const norm = (l: string) => l.toLowerCase().replace(/^\./, "");

  const { Lang } = await import("@ast-grep/napi");
  // pre-compiled with ast-grep
  const builtins: Record<string, string> = {
    html: Lang.Html,
    htm: Lang.Html,
    cjs: Lang.JavaScript,
    mjs: Lang.JavaScript,
    js: Lang.JavaScript,
    cts: Lang.TypeScript,
    mts: Lang.TypeScript,
    ts: Lang.TypeScript,
    typescript: Lang.TypeScript,
    javascript: Lang.JavaScript,
    jsx: Lang.Tsx,
    tsx: Lang.Tsx,
    css: Lang.Css,
  };

  const dynamics: Record<string, string> = {
    h: "c",
    c: "c",
    cpp: "cpp",
    hpp: "cpp",
    hxx: "cpp",
    cxx: "cpp",
    cs: "csharp",
    py: "python",
    sql: "sql",
    yml: "yaml",
    yaml: "yaml",
  };

  const forbidden = ["bin", "exe", "dll"];

  // user provided a string
  if (typeof lang === "string") {
    lang = norm(lang);
    dbgLang(`resolving language ${lang}`);
    const builtin = builtins[lang];
    if (builtin) return builtin;
    else return await loadDynamicLanguage(lang);
  }

  if (!filename) {
    dbgLang(`filename not provided`);
    throw new Error("filename is required to resolve language");
  }

  if (filename) {
    const ext = norm(extname(filename));
    dbgLang(`resolving language for ${ext}`);

    // known builtins
    const builtin = builtins[ext];
    if (builtin) return builtin;

    // known dynamics
    const dynamic = dynamics[ext];
    if (dynamic) return await loadDynamicLanguage(dynamic);

    if (forbidden.includes(ext)) return undefined;

    // try our luck
    return await loadDynamicLanguage(ext);
  }

  dbgLang(`language not resolved`, { lang, filename });
  throw new Error("language not resolved");
}

const loadedDynamicLanguages = new Set<string>();
async function loadDynamicLanguage(langName: string) {
  if (!loadedDynamicLanguages.has(langName)) {
    dbgLang(`loading language: ${langName}`);
    try {
      const { registerDynamicLanguage } = await import("@ast-grep/napi");
      const dynamicLang = (await import(`@ast-grep/lang-${langName}`)).default;
      registerDynamicLanguage({ [langName]: dynamicLang });
      loadedDynamicLanguages.add(langName);
      dbgLang(`language ${langName} registered `);
    } catch (err) {
      dbgLang(`error loading language ${langName}: ${errorMessage(err)}`);
      throw Error(
        `@ast-grep/lang-${langName} package failed to load, please install it using 'npm install -D @ast-grep/lang-${langName}'`,
      );
    }
  }
  return langName;
}

export async function astGrep(options?: CancellationOptions): Promise<Sg> {
  const { cancellationToken } = options || {};
  checkRuntime();
  return Object.freeze<Sg>({
    changeset: astGrepCreateChangeSet,
    search: (lang, glob, matcher, sgOptions) =>
      astGrepFindFiles(lang, glob, matcher, {
        ...(sgOptions || {}),
        cancellationToken,
      }),
    parse: (file, sgOptions) =>
      astGrepParse(file, {
        ...(sgOptions || {}),
        cancellationToken,
      }),
  });
}
