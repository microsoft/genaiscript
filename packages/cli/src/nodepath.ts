import {
    dirname,
    extname,
    basename,
    join,
    normalize,
    relative,
    resolve,
    isAbsolute,
} from "node:path"
import { changeext } from "../../core/src/fs"

/**
 * Creates a frozen object that provides various path manipulation functions.
 * Includes methods for operations such as getting directory names, extensions, basenames, joining paths, normalizing paths, resolving paths, checking if a path is absolute, and changing file extensions.
 * @returns A frozen object with methods for path handling.
 */
export function createNodePath(): Path {
    // Return a frozen object containing path manipulation functions.
    // These functions are imported from node:path and facilitate
    // various operations on file paths.

    return Object.freeze({
        dirname, // Get the directory name of a path
        extname, // Get the extension of a path
        basename, // Get the basename of a path
        join, // Join multiple path segments
        normalize, // Normalize a path to remove redundant separators
        relative, // Get the relative path between two paths
        resolve, // Resolve a sequence of paths to an absolute path
        isAbsolute, // Check if a path is absolute
        changeext,
    })
}
