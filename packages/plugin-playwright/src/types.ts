import type { TimeoutOptions } from "@genaiscript/core";
import type { Page } from "playwright";

export type BrowserPage = Page;

export interface BrowserOptions {
  /**
   * Browser engine for this page. Defaults to chromium
   *
   */
  browser?: "chromium" | "firefox" | "webkit";

  /**
   * If specified, accepted downloads are downloaded into this directory. Otherwise, temporary directory is created and is deleted when browser is closed. In either case, the downloads are deleted when the browser context they were created in is closed.
   */
  downloadsPath?: string;

  /**
   * Whether to run browser in headless mode. More details for Chromium and Firefox. Defaults to true unless the devtools option is true.
   */
  headless?: boolean;

  /**
   * Specify environment variables that will be visible to the browser. Defaults to process.env.
   */
  env?: Record<string, string>;
}

export interface BrowseGotoOptions extends TimeoutOptions {
  /**
   * Referer header value. If provided it will take preference over the referer header value set by
   * [page.setExtraHTTPHeaders(headers)](https://playwright.dev/docs/api/class-page#page-set-extra-http-headers).
   */
  referer?: string;

  /**
   * When to consider operation succeeded, defaults to `load`. Events can be either:
   * - `'domcontentloaded'` - consider operation to be finished when the `DOMContentLoaded` event is fired.
   * - `'load'` - consider operation to be finished when the `load` event is fired.
   * - `'networkidle'` - **DISCOURAGED** consider operation to be finished when there are no network connections for
   *   at least `500` ms. Don't use this method for testing, rely on web assertions to assess readiness instead.
   * - `'commit'` - consider operation to be finished when network response is received and the document started
   *   loading.
   */
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
}

export interface BrowseSessionOptions extends BrowserOptions, BrowseGotoOptions, TimeoutOptions {
  /**
   * Creates a new context for the browser session
   */
  incognito?: boolean;

  /**
   * Base url to use for relative urls
   * @link https://playwright.dev/docs/api/class-browser#browser-new-context-option-base-url
   */
  baseUrl?: string;

  /**
   * Toggles bypassing page's Content-Security-Policy. Defaults to false.
   * @link https://playwright.dev/docs/api/class-browser#browser-new-context-option-bypass-csp
   */
  bypassCSP?: boolean;

  /**
   * Whether to ignore HTTPS errors when sending network requests. Defaults to false.
   * @link https://playwright.dev/docs/api/class-browser#browser-new-context-option-ignore-https-errors
   */
  ignoreHTTPSErrors?: boolean;

  /**
   * Whether or not to enable JavaScript in the context. Defaults to true.
   * @link https://playwright.dev/docs/api/class-browser#browser-new-context-option-java-script-enabled
   */
  javaScriptEnabled?: boolean;

  /**
   * Enable recording video for all pages. Implies incognito mode.
   */
  recordVideo?:
    | boolean
    | {
        width: number;
        height: number;
      };

  /**
   * CDP connection string
   */
  connectOverCDP?: string;
}

export interface ScreenshotOptions extends TimeoutOptions {
  quality?: number;
  scale?: "css" | "device";
  type?: "png" | "jpeg";
  style?: string;
}

export interface PageScreenshotOptions extends ScreenshotOptions {
  fullPage?: boolean;
  omitBackground?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface BrowserLocatorSelector {
  /**
   * Allows locating elements by their ARIA role, ARIA attributes and accessible name.
   * @param role
   * @param options
   */
  getByRole(
    role:
      | "alert"
      | "alertdialog"
      | "application"
      | "article"
      | "banner"
      | "blockquote"
      | "button"
      | "caption"
      | "cell"
      | "checkbox"
      | "code"
      | "columnheader"
      | "combobox"
      | "complementary"
      | "contentinfo"
      | "definition"
      | "deletion"
      | "dialog"
      | "directory"
      | "document"
      | "emphasis"
      | "feed"
      | "figure"
      | "form"
      | "generic"
      | "grid"
      | "gridcell"
      | "group"
      | "heading"
      | "img"
      | "insertion"
      | "link"
      | "list"
      | "listbox"
      | "listitem"
      | "log"
      | "main"
      | "marquee"
      | "math"
      | "meter"
      | "menu"
      | "menubar"
      | "menuitem"
      | "menuitemcheckbox"
      | "menuitemradio"
      | "navigation"
      | "none"
      | "note"
      | "option"
      | "paragraph"
      | "presentation"
      | "progressbar"
      | "radio"
      | "radiogroup"
      | "region"
      | "row"
      | "rowgroup"
      | "rowheader"
      | "scrollbar"
      | "search"
      | "searchbox"
      | "separator"
      | "slider"
      | "spinbutton"
      | "status"
      | "strong"
      | "subscript"
      | "superscript"
      | "switch"
      | "tab"
      | "table"
      | "tablist"
      | "tabpanel"
      | "term"
      | "textbox"
      | "time"
      | "timer"
      | "toolbar"
      | "tooltip"
      | "tree"
      | "treegrid"
      | "treeitem",
    options?: {
      checked?: boolean;
      disabled?: boolean;
      exact?: boolean;
      expanded?: boolean;
      name?: string;
      selected?: boolean;
    } & TimeoutOptions,
  ): BrowserLocator;

  /**
   * Allows locating input elements by the text of the associated <label> or aria-labelledby element, or by the aria-label attribute.
   * @param name
   * @param options
   */
  getByLabel(name: string, options?: { exact?: boolean } & TimeoutOptions): BrowserLocator;

  /**
   * Allows locating elements that contain given text.
   * @param text
   * @param options
   */
  getByText(text: string, options?: { exact?: boolean } & TimeoutOptions): BrowserLocator;

  /** Locate element by the test id. */
  getByTestId(testId: string, options?: TimeoutOptions): BrowserLocator;
}

/**
 * A Locator instance
 * @link https://playwright.dev/docs/api/class-locator
 */
export interface BrowserLocator extends BrowserLocatorSelector {
  /**
   * When the locator points to a list of elements, this returns an array of locators, pointing to their respective elements.
   * locator.all() does not wait for elements to match the locator, and instead immediately returns whatever is present in the page.
   */
  all(): Promise<BrowserLocator[]>;
  /**
   * Click an element
   * @link https://playwright.dev/docs/api/class-locator#locator-click
   */
  click(options?: { button: "left" | "right" | "middle" } & TimeoutOptions): Promise<void>;

  /**
   * Returns when element specified by locator satisfies the state option.
   * @link https://playwright.dev/docs/api/class-locator#locator-wait-for
   */
  waitFor(
    options?: {
      state: "attached" | "detached" | "visible" | "hidden";
    } & TimeoutOptions,
  ): Promise<void>;

  /**
   * Set a value to the input field.
   * @param value
   * @link https://playwright.dev/docs/api/class-locator#locator-fill
   */
  fill(value: string, options?: TimeoutOptions): Promise<void>;

  /**
   * Returns the element.innerText.
   * @link https://playwright.dev/docs/api/class-locator#locator-inner-text
   */
  innerText(options?: TimeoutOptions): Promise<string>;

  /**
   * Returns the element.innerHTML
   * @link https://playwright.dev/docs/api/class-locator#locator-inner-html
   */
  innerHTML(options?: TimeoutOptions): Promise<string>;

  /**
   * Returns the element.textContent
   * @link https://playwright.dev/docs/api/class-locator#locator-text-content
   * @param options
   */
  textContent(options?: TimeoutOptions): Promise<string>;

  /**
   * Returns the value for the matching <input> or <textarea> or <select> element.
   * @link https://playwright.dev/docs/api/class-locator#locator-input-value
   */
  inputValue(options?: TimeoutOptions): Promise<string>;

  /**
   * Get the attribute value
   * @param name
   * @param options
   * @link https://playwright.dev/docs/api/class-locator#locator-get-attribute
   */
  getAttribute(name: string, options?: TimeoutOptions): Promise<null | string>;

  /**
   * Clears the input field.
   * @link https://playwright.dev/docs/api/class-locator#locator-clear
   */
  clear(options?: TimeoutOptions): Promise<void>;

  /**
   * Take a screenshot of the element matching the locator.
   * @link https://playwright.dev/docs/api/class-locator#locator-screenshot
   */
  screenshot(options?: ScreenshotOptions): Promise<Buffer>;

  /**
   * This method waits for actionability checks, then tries to scroll element into view, unless it is completely visible as defined by IntersectionObserver's ratio.
   * @link https://playwright.dev/docs/api/class-locator#locator-scroll-into-view-if-needed
   */
  scrollIntoViewIfNeeded(options?: TimeoutOptions): Promise<void>;

  /**
   * This method narrows existing locator according to the options, for example filters by text. It can be chained to filter multiple times.
   * @param options
   */
  filter(
    options: {
      has?: BrowserLocator;
      hasNot?: BrowserLocator;
      hasNotText?: string | RegExp;
      hasText?: string | RegExp;
    } & TimeoutOptions,
  ): BrowserLocator;
}

/**
 * Playwright Response instance
 * @link https://playwright.dev/docs/api/class-response
 */
export interface BrowseResponse {
  /**
   * Contains a boolean stating whether the response was successful (status in the range 200-299) or not.
   * @link https://playwright.dev/docs/api/class-response#response-ok
   */
  ok(): boolean;
  /**
   * Contains the status code of the response (e.g., 200 for a success).
   * @link https://playwright.dev/docs/api/class-response#response-status
   */
  status(): number;
  /**
   * Contains the status text of the response (e.g. usually an "OK" for a success).
   * @link https://playwright.dev/docs/api/class-response#response-status-text
   */
  statusText(): string;

  /**
   * Contains the URL of the response.
   * @link https://playwright.dev/docs/api/class-response#response-url
   */
  url(): string;
}

export interface BrowserJSHandle {}

export interface BrowserElementHandle {}

export interface BrowserVideo {
  /**
   * Returns the video path once the page is closed.
   */
  path(): Promise<string>;
}

export interface BrowserLocatorOptions {
  /**
   * Narrows down the results of the method to those which contain elements matching this relative locator. For example,
   * `article` that has `text=Playwright` matches `<article><div>Playwright</div></article>`.
   *
   * Inner locator **must be relative** to the outer locator and is queried starting with the outer locator match, not
   * the document root. For example, you can find `content` that has `div` in
   * `<article><content><div>Playwright</div></content></article>`. However, looking for `content` that has `article
   * div` will fail, because the inner locator must be relative and should not use any elements outside the `content`.
   *
   * Note that outer and inner locators must belong to the same frame. Inner locator must not contain
   * [FrameLocator](https://playwright.dev/docs/api/class-framelocator)s.
   */
  has?: BrowserLocator;

  /**
   * Matches elements that do not contain an element that matches an inner locator. Inner locator is queried against the
   * outer one. For example, `article` that does not have `div` matches `<article><span>Playwright</span></article>`.
   *
   * Note that outer and inner locators must belong to the same frame. Inner locator must not contain
   * [FrameLocator](https://playwright.dev/docs/api/class-framelocator)s.
   */
  hasNot?: BrowserLocator;

  /**
   * Matches elements that do not contain specified text somewhere inside, possibly in a child or a descendant element.
   * When passed a [string], matching is case-insensitive and searches for a substring.
   */
  hasNotText?: string | RegExp;

  /**
   * Matches elements containing specified text somewhere inside, possibly in a child or a descendant element. When
   * passed a [string], matching is case-insensitive and searches for a substring. For example, `"Playwright"` matches
   * `<article><div>Playwright</div></article>`.
   */
  hasText?: string | RegExp;
}
