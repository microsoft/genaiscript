import { TraceOptions } from "./trace";
import { runtimeHost } from "./host";
import { JSONLTryParse } from "./jsonl";
import { resolveFileContent, resolveFileContents } from "./file";
import { uniq } from "es-toolkit";
import { addLineNumbers } from "./liner";
import { arrayify } from "./util";
import { filterGitIgnore } from "./gitignore";
import { genaiscriptDebug } from "./debug";
import { tryStat } from "./fs";
import { CancellationOptions, checkCancelled } from "./cancellation";
const dbg = genaiscriptDebug("grep");

async function importRipGrep(options?: TraceOptions) {
  const { trace } = options || {};
  try {
    const { rgPath } = await import("@lvce-editor/ripgrep");
    dbg(`rg: %s`, rgPath);
    const rgStat = await tryStat(rgPath);
    if (!rgStat?.isFile())
      throw new Error(`ripgrep not found at ${rgPath}. Please reinstall genaiscript.`);
    return rgPath;
  } catch (e) {
    dbg(`%O`, e);
    trace?.error(`failed to ripgrep`, e);
    throw e;
  }
}

export type GrepResult = {
  type: "match" | "context" | "begin" | "end";
  data: {
    path: {
      text: string;
    };
    lines: { text: string };
    line_number: number;
  };
}[];

/**
 * Executes a grep-like search across the workspace using ripgrep.
 *
 * @param pattern - The search pattern, either a string or a regular expression.
 * @param options - Optional settings to customize the search behavior:
 *   - `path`: Specifies one or more paths to search.
 *   - `glob`: Array of glob patterns to include or exclude files.
 *   - `readText`: When false, avoids reading file content.
 *   - `applyGitIgnore`: When false, bypasses .gitignore filtering.
 *   - Accepts other trace and workspace-specific options.
 * @returns An object containing:
 *   - `files`: List of files that matched the pattern.
 *   - `matches`: List of detailed matches including filenames and content with line numbers.
 */
export async function grepSearch(
  pattern: string | RegExp,
  options?: TraceOptions & CancellationOptions & WorkspaceGrepOptions,
): Promise<{
  data: GrepResult;
  files: WorkspaceFile[];
  matches: WorkspaceFile[];
}> {
  const { cancellationToken, trace } = options || {};
  const rgPath = await importRipGrep();
  let { path: paths, glob: globs, readText, applyGitIgnore, debug } = options || {};
  globs = arrayify(globs);
  paths = arrayify(paths);
  const args: string[] = ["--json", "--multiline", "--context", "3"];
  if (debug) args.push("--debug");
  if (typeof pattern === "string") {
    args.push("--smart-case", pattern);
  } else {
    if (pattern.ignoreCase) args.push("--ignore-case");
    args.push(pattern.source);
  }
  if (globs)
    for (const glob of globs) {
      args.push("--glob");
      args.push(glob);
    }
  if (paths.length) args.push(...paths);
  else if (globs?.length) args.push(".");
  dbg(`args: %o`, args);
  const res = await runtimeHost.exec(undefined, rgPath, args, options);
  if (!res.stdout) {
    dbg(`no output: %s`, res.stderr);
    return { data: [], files: [], matches: [] };
  }
  const resl = JSONLTryParse(res.stdout || "") as GrepResult;
  checkCancelled(cancellationToken);
  let filenames = uniq(
    resl.filter(({ type }) => type === "match").map(({ data }) => data.path.text),
  );
  if (applyGitIgnore !== false) {
    dbg(`apply git ignore`);
    filenames = await filterGitIgnore(filenames);
  }

  const files = filenames.map((filename) => ({ filename }));
  const filesSet = new Set(filenames);
  const matches = resl
    .filter(({ type }) => type === "match")
    .filter(({ data }) => filesSet.has(data.path.text))
    .map(
      ({ data }) =>
        <WorkspaceFile>{
          filename: data.path.text,
          content: addLineNumbers(data.lines.text.trimEnd(), {
            startLine: data.line_number,
          }),
        },
    );
  dbg(`read text: `, readText);
  if (readText !== false) await resolveFileContents(files, { trace, cancellationToken });
  return { data: resl, files, matches };
}
