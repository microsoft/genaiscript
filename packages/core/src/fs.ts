import { lstat, mkdir, writeFile, readFile, appendFile } from "fs/promises";
import { HTTPS_REGEX } from "./constants";
import { host } from "./host";
import { dirname } from "path";
import { JSON5TryParse } from "./json5";
import { homedir } from "os";
import { genaiscriptDebug } from "./debug";
const dbg = genaiscriptDebug("fs");

/**
 * Changes the file extension of a given file name.
 *
 * @param filename - The name of the file whose extension needs to be changed.
 * @param newext - The new extension to apply. If it does not start with a dot, one will be added automatically.
 * @returns The file name with the updated extension.
 */
export function changeext(filename: string, newext: string) {
  dbg(`checking if newext starts with a dot`);
  if (newext && !newext.startsWith(".")) {
    newext = "." + newext;
  }
  return filename.replace(/\.[^.]+$/, newext);
}

/**
 * Reads the content of a specified file as text.
 *
 * @param fn - Path of the file to be read.
 * @returns The textual content of the file.
 */
export async function readText(fn: string) {
  dbg(`reading file ${fn}`);
  return readFile(fn, { encoding: "utf8" });
}

/**
 * Attempts to read text content from a file. If the file cannot be read, returns undefined.
 *
 * @param fn - The path of the file to read.
 * @returns The content of the file as a string if successfully read, or undefined if an error occurs.
 */
export async function tryReadText(fn: string) {
  try {
    dbg(`trying to read text from file ${fn}`);
    return await readText(fn);
  } catch {
    return undefined;
  }
}

/**
 * Ensures that the specified directory exists.
 * Creates the directory and any necessary parent directories if they do not exist.
 *
 * @param dir - The path of the directory to ensure exists.
 */
export async function ensureDir(dir: string) {
  dbg(`ensuring directory exists ${dir}`);
  await mkdir(dir, { recursive: true });
}

/**
 * Expands homedir
 */
export function expandHomeDir(dir: string) {
  if (dir?.startsWith("~/")) {
    const home = homedir();
    dir = host.path.join(home, dir.slice(2));
  }
  return dir;
}

/**
 * Writes text content to a specified file, creating directories if necessary.
 *
 * @param fn - The path of the file to write to. Directories in the path will be created if they do not exist.
 * @param content - The textual content to write into the file.
 */
export async function writeText(fn: string, content: string) {
  if (!fn) throw new Error("filename is required");
  if (typeof content !== "string") throw new Error("content must be a string");
  await ensureDir(dirname(fn));
  dbg(`writing text to file ${fn}`);
  await writeFile(fn, content, { encoding: "utf8" });
}

/**
 * Appends text content to the end of the specified file, creating directories as needed.
 *
 * @param fn - Path to the file where content will be appended. Must be provided.
 * @param content - Text content to append to the file.
 * @throws Throws an error if the filename is not provided.
 */
export async function appendText(fn: string, content: string) {
  if (!fn) throw new Error("filename is required");
  await ensureDir(dirname(fn));
  dbg(`append text to file ${fn}`);
  await appendFile(fn, content, { encoding: "utf8" });
}

/**
 * Checks if a file exists at the given path.
 *
 * @param fn - The path to the file to check.
 * @returns A promise that resolves to `true` if the file exists and is a file, or `false` otherwise.
 */
export async function fileExists(fn: string) {
  dbg(`checking if file exists ${fn}`);
  const stat = await tryStat(fn);
  return !!stat?.isFile();
}

/**
 * Attempts to retrieve the file status for a given file path.
 * If an error occurs (e.g., the file does not exist), it returns undefined.
 *
 * @param fn - The path of the file to retrieve the status for. If not provided, returns undefined.
 * @returns The file status object if the file exists, or undefined if it does not.
 */
export async function tryStat(fn: string) {
  try {
    dbg(`getting file stats for ${fn}`);
    if (!fn) return undefined;
    return await lstat(fn);
  } catch {
    return undefined;
  }
}

/**
 * Reads and parses a JSON file from the specified path.
 *
 * @param fn - The path to the JSON file to be read.
 * @returns The parsed JSON object from the file.
 * @throws Throws an error if the file cannot be read or parsed as JSON.
 */
export async function readJSON(fn: string) {
  if (!fn) throw new Error("filename is required");
  dbg(`reading JSON from file ${fn}`);
  return JSON.parse(await readText(fn));
}

/**
 * Tries to read and parse a JSON object from a file.
 *
 * @param fn - Path to the file to be read.
 * @returns The parsed JSON object if the operation succeeds, or `undefined` if an error occurs.
 */
export async function tryReadJSON(fn: string) {
  try {
    if (!fn) return undefined;
    return JSON.parse(await readText(fn));
  } catch {
    return undefined;
  }
}

export async function tryReadJSON5(fn: string) {
  try {
    return JSON5TryParse(await readText(fn));
  } catch {
    return undefined;
  }
}

/**
 * Writes a JSON object to a file.
 *
 * @param fn - The path to the file where the JSON object will be written.
 * @param obj - The JSON object to be written to the file.
 */
export async function writeJSON(fn: string, obj: any) {
  if (!fn) throw new Error("filename is required");
  dbg(`writing JSON to file ${fn}`);
  await writeText(fn, JSON.stringify(obj));
}

/**
 * Expands given file paths into a list of file paths and URLs, applying optional filtering and processing.
 *
 * @param files - An array of file paths or URLs to process.
 * @param options - Optional parameters for filtering and processing.
 *   @param excludedFiles - A list of file paths or URLs to exclude from the result.
 *   @param accept - A comma-separated list of file extensions to include (e.g., ".js,.ts").
 *   @param applyGitIgnore - Whether to apply `.gitignore` rules during file discovery.
 * @returns An array of expanded file paths and URLs, filtered based on the given options.
 */
export async function expandFiles(
  files: string[],
  options?: {
    excludedFiles?: string[];
    accept?: string;
    applyGitIgnore?: boolean;
  },
) {
  const { excludedFiles = [], accept, applyGitIgnore } = options || {};
  dbg(`no files to expand or accept is none`);
  if (!files.length || accept === "none") {
    return [];
  }

  dbg(`filtering URLs from files`);
  const urls = files.filter((f) => HTTPS_REGEX.test(f)).filter((f) => !excludedFiles.includes(f));
  dbg(`finding other files`);
  const others = await host.findFiles(
    files.filter((f) => !HTTPS_REGEX.test(f)),
    {
      ignore: excludedFiles.filter((f) => !HTTPS_REGEX.test(f)),
      applyGitIgnore,
    },
  );

  const res = new Set([...urls, ...others]);
  dbg(`applying accept filter`);
  if (accept) {
    const exts = accept
      .split(",")
      .map((s) => s.trim().replace(/^\*\./, "."))
      .filter((s) => !!s);
    for (const rf of res) {
      dbg(`removing file ${rf} as it does not match accepted extensions`);
      if (!exts.some((ext) => rf.endsWith(ext))) {
        res.delete(rf);
      }
    }
  }
  return Array.from(res);
}

/**
 * Expands a list of files or workspace files into a unified list of workspace files.
 *
 * @param files - Array of file paths or workspace file objects to process.
 *   - Strings in the array represent file paths.
 *   - Objects in the array represent workspace files.
 * @returns A Promise resolving to an array of workspace file objects.
 *
 * The function separates file paths and workspace file objects from the input, processes the file paths
 * through `expandFiles` to resolve all matching paths, and combines the results with the workspace file objects.
 */
export async function expandFileOrWorkspaceFiles(
  files: (string | WorkspaceFile)[],
): Promise<WorkspaceFile[]> {
  dbg(`expanding file or workspace files`);
  const filesPaths = await expandFiles(
    files.filter((f) => typeof f === "string"),
    {
      applyGitIgnore: false,
    },
  );
  dbg(`filtering workspace files`);
  const workspaceFiles = files.filter((f) => typeof f === "object") as WorkspaceFile[];
  return [
    ...filesPaths.map(
      (filename) =>
        ({
          filename,
        }) satisfies WorkspaceFile,
    ),
    ...workspaceFiles,
  ];
}

/**
 * Converts a file path or URL into a workspace-friendly file path.
 *
 * @param f - The file path or URL to convert. If the input is a valid HTTPS URL or an absolute file path as resolved by the host, it is returned as-is. Otherwise, the path is prefixed with `./` to create a relative path.
 * @returns The workspace-compatible file path or URL.
 */
export function filePathOrUrlToWorkspaceFile(f: string) {
  dbg(`converting file path or URL to workspace file ${f}`);
  return HTTPS_REGEX.test(f) || host.path.resolve(f) === f ? f : `./${f}`;
}
