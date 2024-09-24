// Import the 'lookup' function from the 'mime-types' library and rename it to 'mimeTypesLookup'
import { lookup as mimeTypesLookup } from "mime-types"

// Define constant MIME types for specific programming languages
export const TYPESCRIPT_MIME_TYPE = "text/x-typescript"
export const CSHARP_MIME_TYPE = "text/x-csharp"
export const PYTHON_MIME_TYPE = "text/x-python"

// Define a function to look up the MIME type for a given filename
/**
 * Looks up the MIME type for a given filename.
 * 
 * @param filename - The name of the file whose MIME type is to be determined.
 * @returns The corresponding MIME type string, or an empty string if not found.
 * 
 * The function first checks for known file extensions for TypeScript, C#, Python, and Astro files.
 * If none match, it uses 'mimeTypesLookup' from the 'mime-types' library to find the MIME type.
 */
export function lookupMime(filename: string) {
    if (!filename) return "" // Return an empty string if the filename is falsy
    
    // Check for TypeScript file extension
    if (/\.ts$/i.test(filename)) return TYPESCRIPT_MIME_TYPE 
    
    // Check for C# file extension
    if (/\.cs$/i.test(filename)) return CSHARP_MIME_TYPE 
    
    // Check for Python file extension
    if (/\.py$/i.test(filename)) return PYTHON_MIME_TYPE 
    
    // Check for Astro file extension
    if (/\.astro$/i.test(filename)) return "text/x-astro" 
    
    // Default to lookup from 'mime-types' or return empty string
    return mimeTypesLookup(filename) || "" 
}
