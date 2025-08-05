import type { TraceOptions } from "@genaiscript/core";
import type { BrowserPage, BrowseSessionOptions } from "./types.js";
/**
 * Manages browser instances using Playwright, including launching,
 * closing, and managing pages. Provides functionalities to handle
 * browser dependencies and sessions.
 */
export declare class BrowserManager {
    private _browsers;
    private _contexts;
    private _pages;
    /**
     * Imports the Playwright module if available.
     * @returns The imported Playwright module.
     * @throws Error if the Playwright module is not available.
     */
    private init;
    /**
     * Launches a browser instance with the given options.
     * Attempts installation if the browser launch fails initially.
     * @param options Optional settings for the browser launch.
     * @returns A promise that resolves to a Browser instance.
     */
    private launchBrowser;
    /**
     * Stops all browser instances and closes all pages.
     * Handles any errors that occur during the closure.
     */
    stopAndRemove(): Promise<void>;
    /**
     * Opens a URL in a new browser page with optional tracing and session options.
     * @param url The URL to browse.
     * @param options Optional settings for the browsing session and trace options.
     * @returns A promise that resolves to a Page object.
     */
    browse(url?: string, options?: BrowseSessionOptions & TraceOptions): Promise<BrowserPage>;
}
//# sourceMappingURL=playwright.d.ts.map