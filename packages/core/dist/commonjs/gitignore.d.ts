export type GitIgnorer = (files: string[]) => string[];
/**
 * Creates a function to filter files based on patterns defined in .gitignore files.
 * Combines multiple .gitignore files (.gitignore, .gitignore.genai, and .genaiscriptignore)
 * into a single filtering logic.
 *
 * @returns A function that takes a list of files and returns only the files not ignored.
 */
export declare function createGitIgnorer(): Promise<GitIgnorer>;
/**
 * Filters a list of files based on the patterns specified in .gitignore files.
 * Utilizes the 'ignore' library to determine which files should be excluded.
 *
 * @param files - An array of file paths to be filtered.
 * @returns An array of files that are not ignored according to the .gitignore patterns.
 */
export declare function filterGitIgnore(files: string[]): Promise<string[]>;
/**
 * Ensures specified entries are present in the .gitignore file within the given directory.
 * If any of the entries are missing, they are appended to the file.
 *
 * @param dir - Directory path where the .gitignore file is located.
 * @param entries - List of patterns or file paths to ensure are included in the .gitignore file.
 */
export declare function gitIgnoreEnsure(dir: string, entries: string[]): Promise<void>;
//# sourceMappingURL=gitignore.d.ts.map
