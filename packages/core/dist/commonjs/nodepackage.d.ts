export interface NodePackage {
  type?: string;
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bundledDependencies?: string[];
  engines?: Record<string, string>;
  os?: string[];
  cpu?: string[];
  private?: boolean;
  publishConfig?: Record<string, string>;
  repository?: Record<string, string>;
  author?: string;
  license?: string;
  bugs?: Record<string, string>;
  homepage?: string;
  keywords?: string[];
  displayName?: string;
}
/**
 * Reads and parses the `package.json` file located in the current directory.
 *
 * @returns A promise that resolves with the parsed contents of the `package.json` file as a NodePackage object.
 *          If the file cannot be read or parsed, the promise may reject with an error.
 */
export declare function nodeTryReadPackage(): Promise<NodePackage>;
/**
 * Determines if the package is of type "module" by reading the package.json file.
 *
 * @returns A promise that resolves to a boolean indicating if the package type is "module".
 */
export declare function nodeIsPackageTypeModule(): Promise<boolean>;
//# sourceMappingURL=nodepackage.d.ts.map
