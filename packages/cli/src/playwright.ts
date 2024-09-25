import type { Browser, Page } from "playwright"
import { TraceOptions } from "../../core/src/trace"
import { logError, logVerbose } from "../../core/src/util"
import { runtimeHost } from "../../core/src/host"
import { PLAYWRIGHT_VERSION } from "./version"
import { ellipseUri } from "../../core/src/url"
import { PLAYWRIGHT_DEFAULT_BROWSER } from "../../core/src/constants"
import { log } from "node:console"

/**
 * Manages browser instances using Playwright, including launching,
 * closing, and managing pages. Provides functionalities to handle
 * browser dependencies and sessions.
 */
export class BrowserManager {
    private _browsers: Browser[] = [] // Stores active browser instances
    private _pages: Page[] = [] // Stores active pages

    constructor() {}

    /**
     * Imports the Playwright module if available.
     * @returns The imported Playwright module.
     * @throws Error if the Playwright module is not available.
     */
    private async init() {
        const p = await import("playwright")
        if (!p) throw new Error("playwright installation not completed")
        return p
    }

    /**
     * Installs Playwright dependencies for a specific vendor.
     * Uses the runtimeHost to execute the necessary commands.
     * @param vendor The vendor for which to install Playwright.
     * @throws Error if the installation fails.
     */
    private async installDependencies(vendor: string) {
        const res = await runtimeHost.exec(
            undefined,
            "npx",
            [
                "--yes,",
                `playwright@${PLAYWRIGHT_VERSION}`,
                "install",
                "--with-deps",
                vendor,
            ],
            {
                label: `installing playwright ${vendor}`,
            }
        )
        if (res.exitCode) throw new Error("playwright installation failed")
    }

    /**
     * Launches a browser instance with the given options.
     * Attempts installation if the browser launch fails initially.
     * @param options Optional settings for the browser launch.
     * @returns A promise that resolves to a Browser instance.
     */
    private async launchBrowser(options?: BrowserOptions): Promise<Browser> {
        const { browser = PLAYWRIGHT_DEFAULT_BROWSER, ...rest } = options || {}
        try {
            const playwright = await this.init()
            return await playwright[browser].launch(rest)
        } catch {
            logVerbose("trying to install playwright...")
            await this.installDependencies(browser)
            const playwright = await this.init()
            return await playwright[browser].launch(rest)
        }
    }

    /**
     * Stops all browser instances and closes all pages.
     * Handles any errors that occur during the closure.
     */
    async stopAndRemove() {
        const browsers = this._browsers.slice(0)
        const pages = this._pages.slice(0)

        this._browsers = []
        this._pages = []

        // Close all active pages
        for (const page of pages) {
            try {
                if (!page.isClosed()) {
                    logVerbose(`browsers: closing page`)
                    await page.close()
                }
            } catch (e) {
                logError(e)
            }
        }

        // Close all active browsers
        for (const browser of browsers) {
            try {
                if (browser.isConnected()) {
                    logVerbose(`browsers: closing browser`)
                    await browser.close()
                }
            } catch (e) {
                logError(e)
            }
        }
    }

    /**
     * Opens a URL in a new browser page with optional tracing and session options.
     * @param url The URL to browse.
     * @param options Optional settings for the browsing session and trace options.
     * @returns A promise that resolves to a Page object.
     */
    async browse(
        url: string,
        options?: BrowseSessionOptions & TraceOptions
    ): Promise<BrowserPage> {
        const { trace, incognito, timeout, ...rest } = options || {}

        logVerbose(`browsing ${ellipseUri(url)}`)
        const browser = await this.launchBrowser(options)
        let page: Page

        // Open a new page in incognito mode if specified
        if (incognito) {
            const context = await browser.newContext(rest)
            page = await context.newPage()
        } else {
            page = await browser.newPage(rest)
        }

        // Set page timeout if specified
        if (timeout !== undefined) page.setDefaultTimeout(timeout)

        // Navigate to the specified URL
        if (url) await page.goto(url)

        return page
    }
}
