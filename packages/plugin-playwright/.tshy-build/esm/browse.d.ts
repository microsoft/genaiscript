import type { BrowserPage, BrowseSessionOptions } from "./types.js";
/**
 * Starts a headless browser and navigates to the page.
 * Requires to [install playwright and dependencies](https://microsoft.github.io/genaiscript/reference/scripts/browser).
 * @link https://microsoft.github.io/genaiscript/reference/scripts/browser
 * @param url
 * @param options
 */
export declare function browse(url?: string, options?: BrowseSessionOptions): Promise<BrowserPage>;
//# sourceMappingURL=browse.d.ts.map