// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { PLAYWRIGHT_DEFAULT_BROWSER, createVideoDir, genaiscriptDebug, uriRedact, } from "@genaiscript/core";
const dbg = genaiscriptDebug("playwright");
/**
 * Manages browser instances using Playwright, including launching,
 * closing, and managing pages. Provides functionalities to handle
 * browser dependencies and sessions.
 */
export class BrowserManager {
    _browsers = []; // Stores active browser instances
    _contexts = []; // Stores active browser contexts
    _pages = []; // Stores active pages
    /**
     * Imports the Playwright module if available.
     * @returns The imported Playwright module.
     * @throws Error if the Playwright module is not available.
     */
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    async init() {
        const p = await import("playwright");
        if (!p)
            throw new Error("playwright installation not completed");
        return p;
    }
    /**
     * Launches a browser instance with the given options.
     * Attempts installation if the browser launch fails initially.
     * @param options Optional settings for the browser launch.
     * @returns A promise that resolves to a Browser instance.
     */
    async launchBrowser(options) {
        const { browser = PLAYWRIGHT_DEFAULT_BROWSER, connectOverCDP, ...rest } = options || {};
        const launch = async () => {
            const playwright = await this.init();
            const engine = playwright[browser];
            if (connectOverCDP)
                return engine.connectOverCDP(connectOverCDP);
            return engine.launch(rest);
        };
        return launch();
    }
    /**
     * Stops all browser instances and closes all pages.
     * Handles any errors that occur during the closure.
     */
    async stopAndRemove() {
        const browsers = this._browsers.slice(0);
        const contexts = this._contexts.slice(0);
        const pages = this._pages.slice(0);
        this._browsers = [];
        this._contexts = [];
        this._pages = [];
        // Close all active pages
        for (const page of pages) {
            try {
                if (!page.isClosed()) {
                    dbg(`browsers: closing page`);
                    await page.close();
                }
            }
            catch (e) {
                dbg(`browsers: error closing page: ${e}`);
            }
        }
        for (const context of contexts) {
            try {
                dbg(`browsers: closing context`);
                await context.close();
            }
            catch (e) {
                dbg(`browsers: error closing context: ${e}`);
            }
        }
        // Close all active browsers
        for (const browser of browsers) {
            try {
                dbg(`browsers: closing browser`);
                await browser.close();
            }
            catch (e) {
                dbg(`browsers: error closing browser: ${e}`);
            }
        }
    }
    /**
     * Opens a URL in a new browser page with optional tracing and session options.
     * @param url The URL to browse.
     * @param options Optional settings for the browsing session and trace options.
     * @returns A promise that resolves to a Page object.
     */
    async browse(url, options) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { trace, incognito, timeout, recordVideo, waitUntil, referer, connectOverCDP, ...rest } = options || {};
        dbg(`browsing ${uriRedact(url)}`);
        const browser = await this.launchBrowser(options);
        let page;
        // Open a new page in incognito mode if specified
        if (incognito || recordVideo) {
            const contextOptions = { ...rest };
            if (recordVideo) {
                const dir = await createVideoDir();
                trace?.itemValue(`video dir`, dir);
                contextOptions.recordVideo = { dir };
                if (typeof recordVideo === "object")
                    contextOptions.recordVideo.size = recordVideo;
            }
            const context = await browser.newContext(contextOptions);
            this._contexts.push(context);
            page = await context.newPage();
        }
        else {
            page = await browser.newPage(rest);
        }
        page.on("close", async () => {
            const video = page.video();
            if (video) {
                const p = await video.path();
                if (p)
                    trace?.video(`video recording of ${page.url()}`, p);
            }
        });
        this._pages.push(page);
        // Set page timeout if specified
        if (timeout !== undefined)
            page.setDefaultTimeout(timeout);
        // Navigate to the specified URL
        if (url)
            await page.goto(url, { waitUntil, referer, timeout });
        return page;
    }
}
//# sourceMappingURL=playwright.js.map