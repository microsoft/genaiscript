import { resolveRuntimeHost } from "@genaiscript/core";
import { BrowserManager } from "./playwright.js";
const ID = "plugin-playwright-browser";
/**
 * Starts a headless browser and navigates to the page.
 * Requires to [install playwright and dependencies](https://microsoft.github.io/genaiscript/reference/scripts/browser).
 * @link https://microsoft.github.io/genaiscript/reference/scripts/browser
 * @param url
 * @param options
 */
export async function browse(url, options) {
    const runtimeHost = resolveRuntimeHost();
    const browsers = runtimeHost.userState[ID] ??
        (runtimeHost.userState[ID] = new BrowserManager());
    return browsers.browse(url, options);
}
//# sourceMappingURL=browse.js.map