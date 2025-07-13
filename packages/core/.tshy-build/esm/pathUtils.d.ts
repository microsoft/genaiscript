export declare function getModulePaths(metaOrModule: {
    url?: string;
    filename?: string;
}): {
    __filename: string;
    __dirname: string;
};
/**
 * Resolves modules in CommonJS and ESM environments.
 * @param moduleName
 * @returns
 */
export declare function moduleResolve(moduleName: string): string;
//# sourceMappingURL=pathUtils.d.ts.map