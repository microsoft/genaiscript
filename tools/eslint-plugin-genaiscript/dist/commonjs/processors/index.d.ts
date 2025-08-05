/**
 * @file Definition of processors
 */
import type { Linter } from "eslint";
/**
 * An object containing processors used by the plugin
 */
declare const _default: {
    /**
     * The processor for JSON files
     * Ignores the no-unused-expressions ESLint rule
     */
    ".json": {
        preprocess: (text: string) => string[];
        postprocess: (messages: Linter.LintMessage[][]) => Linter.LintMessage[];
        supportsAutofix: boolean;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map