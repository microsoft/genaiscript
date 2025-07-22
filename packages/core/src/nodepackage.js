// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import debug from "debug";
const dbg = debug("genaiscript:node:package");
import { tryReadJSON } from "./fs.js";
/**
 * Reads and parses the `package.json` file located in the current directory.
 *
 * @returns A promise that resolves with the parsed contents of the `package.json` file as a NodePackage object.
 *          If the file cannot be read or parsed, the promise may reject with an error.
 */
export async function nodeTryReadPackage() {
    return await tryReadJSON("package.json");
}
/**
 * Determines if the package is of type "module" by reading the package.json file.
 *
 * @returns A promise that resolves to a boolean indicating if the package type is "module".
 */
export async function nodeIsPackageTypeModule() {
    const pkg = await nodeTryReadPackage();
    dbg(`type: ${pkg?.type || ""}`);
    const isModule = pkg?.type === "module";
    return isModule;
}
//# sourceMappingURL=nodepackage.js.map