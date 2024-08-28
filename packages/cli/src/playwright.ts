import type { Browser, Page } from "playwright"
import { TraceOptions } from "../../core/src/trace"
import { logError, logVerbose } from "../../core/src/util"
import { runtimeHost } from "../../core/src/host"
import { PLAYWRIGHT_VERSION } from "./version"
import { ellipseUri } from "../../core/src/url"

type PlaywrightModule = typeof import("playwright")

export class BrowserManager {
    private _playwright: PlaywrightModule
    private _browsers: Browser[] = []
    private _pages: Page[] = []

    constructor() {}

    private async init() {
        if (!this._playwright) {
            const p = await import("playwright")
            if (!p) throw new Error("playwright installation not completed")
            this._playwright = p
        }
        return this._playwright
    }

    private async installDependencies() {
        const res = await runtimeHost.exec(
            undefined,
            "npx",
            [`playwright@${PLAYWRIGHT_VERSION}`, "install-deps", "chromium"],
            {
                label: "installing playwright dependencies",
            }
        )
        if (res.exitCode) throw new Error("playwright installation failed")
    }

    private async launchBrowser(options?: {}) {
        const playwright = await this.init()
        try {
            const browser = await playwright.chromium.launch()
            return browser
        } catch {
            await this.installDependencies()
            const browser = await playwright.chromium.launch()
            return browser
        }
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

        logVerbose(`browsing ${ellipseUri(url)}`)
        const browser = await this.launchBrowser(options)
        let page: BrowserPage
        if (incognito) {
            const context = await browser.newContext(rest)
            page = await context.newPage()
        } else {
            page = await browser.newPage(rest)
        }
        if (url) await page.goto(url)
        return page
    }
}
