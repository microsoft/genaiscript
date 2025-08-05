export declare const FSTAR_MIME_TYPE = "text/x-fstar";
export declare const TYPESCRIPT_MIME_TYPE = "text/x-typescript";
export declare const CSHARP_MIME_TYPE = "text/x-csharp";
export declare const PYTHON_MIME_TYPE = "text/x-python";
export declare const MARKDOWN_MIME_TYPE = "text/markdown";
export declare const ASTRO_MIME_TYPE = "text/x-astro";
/**
 * Looks up the MIME type for a given filename.
 *
 * @param filename - The name of the file whose MIME type is to be determined.
 * @returns The corresponding MIME type string, or an empty string if not found.
 *
 * The function first checks for known file extensions for TypeScript, C#, Python, and Astro files.
 * If none match, it uses 'mimeTypesLookup' from the 'mime-types' library to find the MIME type.
 */
export declare function lookupMime(filename: string): string;
//# sourceMappingURL=mime.d.ts.map