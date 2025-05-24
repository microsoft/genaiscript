GenAIScript provides a simplified API to interact with a headless browser using [Playwright](https://playwright.dev/) .
This allows you to interact with web pages, scrape data, and automate tasks.

```js
const page = await host.browse(
    "https://github.com/microsoft/genaiscript/blob/main/packages/sample/src/penguins.csv"
)
const table = page.locator('table[data-testid="csv-table"]')
const csv = parsers.HTMLToMarkdown(await table.innerHTML())
def("DATA", csv)
$`Analyze DATA.`
```

## Installation

Playwright needs to [install the browsers and dependencies](https://playwright.dev/docs/browsers#install-system-dependencies) before execution. GenAIScript will automatically try to install them if it fails to load the browser.
However, you can also do it manually using the following command:

```bash
npx playwright install --with-deps chromium
```

If you see this error message, you might have to install the dependencies manually.

```text
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     yarn playwright install                                             ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## `host.browse`

This function launches a new browser instance and optionally navigates to a page. The pages are automatically closed when the script ends.

```js
const page = await host.browse(url)
```

### `incognito``

Setting `incognito: true` will create a isolated non-persistent browser context. Non-persistent browser contexts don't write any browsing data to disk.

```js
const page = await host.browse(url, { incognito: true })
```

### `recordVideo`

Playwright can record a video of each page in the browser session. You can enable it by passing the `recordVideo` option.
Recording video also implies `incognito` mode as it requires creating a new browsing context.

```js
const page = await host.browse(url, { recordVideo: true })
```

By default, the video size will be 800x600 but you can change it by passing the sizes as the `recordVideo` option.

```js
const page = await host.browse(url, {
    recordVideo: { width: 500, height: 500 },
})
```

The video will be saved in a temporary directory under `.genaiscript/videos/<timestamp>/` once the page is closed.
**You need to close the page before accessing the video file.**

```js
await page.close()
const videoPath = await page.video().path()
```

The video file can be further processed using video tools.

### `connectOverCDP`

You can provide an enpoint that uses the [Chrome DevTools Protocol](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp) using the `connectOverCDP`.

```js
const page = await host.browse(url, { connectOverCDP: "endpointurl" })
```

## Locators

You can select elements on the page using the `page.get...` or `page.locator` method.

```js
// select by Aria roles
const button = page.getByRole("button")
// select by test-id
const table = page.getByTestId("csv-table")
```

## Element contents

You can access `innerHTML`, `innerText`, `value` and `textContent` of an element.

```js
const table = page.getByTestId("csv-table")
const html = table.innerHTML() // without the outer <table> tags!
const text = table.innerText()
const value = page.getByRole("input").value()
```

You can use the parsers in [HTML](/genaiscript/reference/scripts/html) to convert the HTML to Markdown.

```js
const md = await HTML.convertToMarkdown(html)
const text = await HTML.convertToText(html)
const tables = await HTML.convertTablesToJSON(html)
```

## Screenshot

You can take a screenshot of the current page or a locator and use it with vision-enabled LLM (like `gpt-4o`) using `defImages`.

```js
const screenshot = await page.screenshot() // returns a node.js Buffer
defImages(screenshot)
```

## (Advanced) Native Playwright APIs

The `page` instance returned is a native [Playwright Page](https://playwright.dev/docs/api/class-page) object.
You can import `playwright` and cast the instance back to the native Playwright object.

```js
import { Page } from "playwright"

const page = await host.browse(url) as Page
```