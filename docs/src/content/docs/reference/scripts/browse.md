---
title: Browse
sidebar:
    order: 30
---

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

Playwright needs to [install the browsers and dependencies](https://playwright.dev/docs/browsers#install-system-dependencies) before execution. GenAIScript will automatically try to install them if it fails to load the browser;
but you can also do it manually using the following command:

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

This function launches a new browser instance and optionally navigates to the page.

```js
const page = await host.browse(url)
```

You can configure a number of options for the browser instance:

```js
const page = await host.browse(url, { incognito: true })
```

## (Advanced) Native Playwright APIs

The `page` instance returned is a native [Playwright Page](https://playwright.dev/docs/api/class-page) object.
You can import `playwright` and case the instance back to the native playwright object.

```js
import { Page } from "playwright"

const page = await host.browse(url) as Page
```
