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

# `host.browse`

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
