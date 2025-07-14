import { runtimeHost, type BrowserPage, type BrowseSessionOptions } from "@genaiscript/core";
import { BrowserManager } from "./playwright.js";

const ID = "plugin-playwright-browser";

/**
 * Starts a headless browser and navigates to the page.
 * Requires to [install playwright and dependencies](https://microsoft.github.io/genaiscript/reference/scripts/browser).
 * @link https://microsoft.github.io/genaiscript/reference/scripts/browser
 * @param url
 * @param options
 */
export async function browse(url?: string, options?: BrowseSessionOptions): Promise<BrowserPage> {
  const browsers: BrowserManager =
    (runtimeHost.userState[ID] as BrowserManager) ??
    (runtimeHost.userState[ID] = new BrowserManager());
  return browsers.browse(url, options);
}
