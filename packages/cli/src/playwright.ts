import type {
    Browser,
    BrowserContext,
    BrowserContextOptions,
    Page,
} from "playwright"
import { TraceOptions } from "../../core/src/trace"
import { logError, logVerbose } from "../../core/src/util"
import { runtimeHost } from "../../core/src/host"
import { PLAYWRIGHT_VERSION } from "./version"
import { uriRedact } from "../../core/src/url"
import { PLAYWRIGHT_DEFAULT_BROWSER } from "../../core/src/constants"
import { createVideoDir } from "../../core/src/workdir"

/**
 * Manages browser instances using Playwright, including launching,
 * closing, and managing pages. Provides functionalities to handle
 * browser dependencies and sessions.
 */
export class BrowserManager {
    private _browsers: Browser[] = [] // Stores active browser instances
    private _contexts: BrowserContext[] = [] // Stores active browser contexts
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
                "--yes",
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
    private async launchBrowser(
        options?: BrowseSessionOptions
    ): Promise<Browser> {
        const launch = async () => {
            const playwright = await this.init()
            const engine = playwright[browser]
            if (connectOverCDP)
                return await engine.connectOverCDP(connectOverCDP)
            return await engine.launch(rest)
        }

        const {
            browser = PLAYWRIGHT_DEFAULT_BROWSER,
            connectOverCDP,
            ...rest
        } = options || {}
        try {
            return await launch()
        } catch {
            logVerbose("trying to install playwright...")
            await this.installDependencies(browser)
            return await launch()
        }
    }

    /**
     * Stops all browser instances and closes all pages.
     * Handles any errors that occur during the closure.
     */
    async stopAndRemove() {
        const browsers = this._browsers.slice(0)
        const contexts = this._contexts.slice(0)
        const pages = this._pages.slice(0)

        this._browsers = []
        this._contexts = []
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

        for (const context of contexts) {
            try {
                logVerbose(`browsers: closing context`)
                await context.close()
            } catch (e) {
                logError(e)
            }
        }

        // Close all active browsers
        for (const browser of browsers) {
            try {
                logVerbose(`browsers: closing browser`)
                await browser.close()
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
        url?: string,
        options?: BrowseSessionOptions & TraceOptions
    ): Promise<BrowserPage> {
        const {
            trace,
            incognito,
            timeout,
            recordVideo,
            waitUntil,
            referer,
            connectOverCDP,
            ...rest
        } = options || {}

        logVerbose(`browsing ${uriRedact(url)}`)
        const browser = await this.launchBrowser(options)
        let page: Page

        // Open a new page in incognito mode if specified
        if (incognito || recordVideo) {
            const options = { ...rest } as BrowserContextOptions
            if (recordVideo) {
                const dir = await createVideoDir()
                trace?.itemValue(`video dir`, dir)
                options.recordVideo = { dir }
                if (typeof recordVideo === "object")
                    options.recordVideo.size = recordVideo
            }
            const context = await browser.newContext(options)
            this._contexts.push(context)
            page = await context.newPage()
        } else {
            page = await browser.newPage(rest)
        }
        page.on("close", async () => {
            const video = page.video()
            if (video) {
                const p = await video.path()
                if (p) trace?.video(`video recording of ${page.url()}`, p)
            }
        })
        this._pages.push(page)

        // Set page timeout if specified
        if (timeout !== undefined) page.setDefaultTimeout(timeout)

        // Navigate to the specified URL
        if (url) await page.goto(url, { waitUntil, referer, timeout })

        return page
    }
}
