import debug from "debug";
const dbg = debug("genaiscript:workspace");

import { copyFile, mkdir, writeFile } from "fs/promises";
import { DOT_ENV_REGEX } from "./constants";
import { CSVTryParse } from "./csv";
import { dataTryParse } from "./data";
import { NotSupportedError, errorMessage } from "./error";
import { resolveFileContent, toWorkspaceFile } from "./file";
import { appendText, readText, tryStat, writeText } from "./fs";
import { host } from "./host";
import { INITryParse } from "./ini";
import { JSON5TryParse } from "./json5";
import { arrayify } from "./util";
import { XMLTryParse } from "./xml";
import { YAMLTryParse } from "./yaml";
import { dirname } from "path";
import { createCache } from "./cache";
import { tryValidateJSONWithSchema } from "./schema";

/**
 * Creates a file system interface for interacting with workspace files.
 *
 * @returns An object implementing the WorkspaceFileSystem functionalities, excluding "grep" and "writeCached".
 *
 * Functions:
 * - `findFiles(glob, options)`: Searches for files matching a glob pattern. Filters out `.env` files and adheres to gitignore settings. The `options` object can include:
 *   - `readText`: Whether to read file contents (default: true).
 *   - `ignore`: Patterns to ignore during the search.
 *   - `applyGitIgnore`: Whether to apply gitignore rules (default: true).
 * - `writeText(filename, c)`: Writes `c` (content) to the specified `filename`. Throws error if writing to `.env` files.
 * - `appendText(filename, c)`: Appends `c` (content) to the specified `filename`. Throws error if writing to `.env` files.
 * - `readText(f)`: Reads the content of a file or a WorkspaceFile object. Throws if the file name is missing.
 * - `readJSON(f, options)`: Reads and parses JSON content from the given file or WorkspaceFile. Optionally validates with a schema.
 * - `readYAML(f, options)`: Reads and parses YAML content from the given file or WorkspaceFile. Optionally validates with a schema.
 * - `readXML(f, options)`: Reads and parses XML content from the given file or WorkspaceFile. The `options` parameter supports parsing configuration and schema validation.
 * - `readCSV(f, options)`: Reads and parses CSV content into an array of objects. Accepts `options` for CSV parsing customization and schema validation.
 * - `readINI(f, options)`: Reads and parses INI content into an object. Accepts `options` for default value configuration and parsing, and schema validation.
 * - `readData(f, options)`: Reads a generic data file and applies parsing logic. Optionally validates with a schema.
 * - `cache(name)`: Retrieves a JSON line-based cache by `name`. Throws error if `name` is missing.
 * - `stat(filename)`: Retrieves the size and mode (permissions) of the specified file. Returns `undefined` if the file does not exist.
 * - `copyFile(src, dest)`: Copies a file from `src` to `dest`. Throws error if `.env` files are involved.
 * - `writeFiles(files)`: Writes a batch of WorkspaceFile objects to the file system. Supports encoding (e.g., base64) if specified.
 */
export function createWorkspaceFileSystem(): Omit<WorkspaceFileSystem, "grep" | "writeCached"> {
  const checkWrite = (filename: string) => {
    if (DOT_ENV_REGEX.test(filename)) {
      throw new Error("writing .env not allowed");
    }
  };

  const fs = {
    findFiles: async (glob: string, options: FindFilesOptions) => {
      dbg(`findFiles: ${JSON.stringify(options)}`);
      const { readText, ignore, applyGitIgnore } = options || {};
      const names = (
        await host.findFiles(glob, {
          ignore: ["**/.env", ...arrayify(ignore)],
          applyGitIgnore: applyGitIgnore !== false,
        })
      ).filter((f) => !DOT_ENV_REGEX.test(f));
      const files: WorkspaceFile[] = [];
      for (const filename of names) {
        const file: WorkspaceFile =
          readText === false
            ? {
                filename,
              }
            : await fs.readText(filename);
        files.push(file);
      }
      return files;
    },
    writeText: async (filename: string, c: string) => {
      checkWrite(filename);
      await writeText(filename, c);
    },
    appendText: async (filename: string, c: string) => {
      checkWrite(filename);
      await appendText(filename, c);
    },
    readText: async (f: string | Awaitable<WorkspaceFile>) => {
      if (f === undefined) {
        throw new NotSupportedError("missing file name");
      }

      const file: WorkspaceFile =
        typeof f === "string"
          ? {
              filename: f,
              content: undefined,
            }
          : await f;
      if (DOT_ENV_REGEX.test(file.filename)) {
        dbg(`filename matches DOT_ENV_REGEX: ${file.filename}`);
        return file;
      }
      try {
        dbg(`resolving file content for: ${file.filename}`);
        await resolveFileContent(file);
      } catch (e) {
        dbg(`error reading file ${file.filename}: ${errorMessage(e)}`);
      }
      return file;
    },
    readJSON: async (
      f: string | Awaitable<WorkspaceFile>,
      options?: JSONSchemaValidationOptions,
    ): Promise<any> => {
      const file = await fs.readText(f);
      const res = JSON5TryParse(file.content, undefined);
      return tryValidateJSONWithSchema(res, options);
    },
    readYAML: async (
      f: string | Awaitable<WorkspaceFile>,
      options?: JSONSchemaValidationOptions,
    ): Promise<any> => {
      const file = await fs.readText(f);
      const res = YAMLTryParse(file.content);
      return tryValidateJSONWithSchema(res, options);
    },
    readXML: async (f: string | Awaitable<WorkspaceFile>, options?: XMLParseOptions) => {
      const file = await fs.readText(f);
      const res = XMLTryParse(file.content, options);
      return tryValidateJSONWithSchema(res, options);
    },
    readCSV: async <T extends object>(
      f: string | Awaitable<WorkspaceFile>,
      options?: CSVParseOptions,
    ): Promise<T[]> => {
      const file = await fs.readText(f);
      const res = CSVTryParse(file.content, options) as T[];
      return tryValidateJSONWithSchema(res, options);
    },
    readINI: async (
      f: string | Awaitable<WorkspaceFile>,
      options?: INIParseOptions,
    ): Promise<any> => {
      const file = await fs.readText(f);
      const res = INITryParse(file.content, options?.defaultValue);
      return tryValidateJSONWithSchema(res, options);
    },
    readData: async (
      f: string | Awaitable<WorkspaceFile>,
      options?: JSONSchemaValidationOptions,
    ): Promise<any> => {
      const file = await f;
      const data = await dataTryParse(toWorkspaceFile(file), options);
      return data;
    },
    cache: async (name: string) => {
      const res = createCache<any, any>(name, { type: "fs" });
      return res;
    },
    stat: async (filename: string) => {
      const stat = await tryStat(filename);
      return stat ? { size: stat.size, mode: stat.mode } : undefined;
    },
    copyFile: async (src: string, dest: string) => {
      if (DOT_ENV_REGEX.test(src) || DOT_ENV_REGEX.test(dest)) {
        throw new Error("copying .env not allowed");
      }
      dbg(`copying file from ${src} to ${dest}`);
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(src, dest);
    },
    writeFiles: async (files: ElementOrArray<WorkspaceFile>) => {
      for (const file of arrayify(files)) {
        const { filename, content, encoding } = file;
        checkWrite(filename);
        if (!encoding) await fs.writeText(file.filename, file.content);
        else if (encoding === "base64") {
          const buf = Buffer.from(content, "base64");
          await writeFile(filename, buf);
        }
      }
    },
  } satisfies Omit<WorkspaceFileSystem, "grep" | "writeCached">;
  (fs as any).readFile = readText;
  return Object.freeze(fs);
}
