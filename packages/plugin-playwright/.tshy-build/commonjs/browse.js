"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browse = browse;
const core_1 = require("@genaiscript/core");
const playwright_js_1 = require("./playwright.js");
const ID = "plugin-playwright-browser";
/**
 * Starts a headless browser and navigates to the page.
 * Requires to [install playwright and dependencies](https://microsoft.github.io/genaiscript/reference/scripts/browser).
 * @link https://microsoft.github.io/genaiscript/reference/scripts/browser
 * @param url
 * @param options
 */
async function browse(url, options) {
    const runtimeHost = (0, core_1.resolveRuntimeHost)();
    const browsers = runtimeHost.userState[ID] ??
        (runtimeHost.userState[ID] = new playwright_js_1.BrowserManager());
    return browsers.browse(url, options);
}
//# sourceMappingURL=browse.js.map