import type { Browser, BrowserContext, Page } from "playwright"
import { TraceOptions } from "../../core/src/trace"
import { logError, logVerbose } from "../../core/src/util"
import { HTMLToMarkdown } from "../../core/src/html"

type PlaywrightModule = typeof import("playwright")

export class BrowserManager {
    private _playwright: PlaywrightModule
    private _browsers: Browser[] = []
    private _pages: Page[] = []

    constructor() {}

    private async init() {
        if (this._playwright) return
        const p = await import("playwright")
        if (!p) throw new Error("playwright installation not completed")
        this._playwright = p
    }

    private async launchBrowser(options?: {}) {
        await this.init()
        const browser = await this._playwright.chromium.launch()
        return browser
    }

    async stopAndRemove() {
        if (!this._playwright) return

        const browsers = this._browsers.slice(0)
        const pages = this._pages.slice(0)

        this._browsers = []
        this._pages = []

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

    async browse(
        url: string,
        options?: BrowseSessionOptions & TraceOptions
    ): Promise<BrowserPage> {
        const { trace, incognito, ...rest } = options || {}

        logVerbose(`browsing`)
        const browser = await this.launchBrowser(options)
        let playwritePage: Omit<BrowserPage, "markdown">
        if (incognito) {
            const context = await browser.newContext(rest)
            playwritePage = await context.newPage()
        } else {
            playwritePage = await browser.newPage(rest)
        }

        // extend object
        const page: BrowserPage = playwritePage as BrowserPage
        page.markdown = async () =>
            HTMLToMarkdown(await playwritePage.content())

        if (url) await page.goto(url)
        return page
    }
}
