
In this blog post, we'll dive into a practical example showcasing how to leverage GenAIScript for automatic web page content analysis. GenAIScript uses the [playwright](https://playwright.dev/) browser automation library which allows to load, interact and inspect web pages.

### Step-by-Step Explanation of the Code

The following snippet provides a concise and effective way to analyze a web page's content using GenAIScript:

```javascript
const page = await host.browse("https://bing.com")
const screenshot = await page.screenshot()
defImages(screenshot, { maxWidth: 800 })
const text = parsers.HTMLtoMarkdown(await page.content())
def("PAGE_TEXT", text)
$`Analyze the content of the page and provide insights.`
```

Let's break down what each line of this script does:

#### 1. Navigating to a Web Page

```javascript
const page = await host.browse("https://example.com")
```

This line automatically navigates to the specified URL (`https://example.com`). The `host.browse` function is a powerful feature of GenAIScript that initializes a browser session and returns a page object for further interactions.

#### 2. Taking a Screenshot

```javascript
const screenshot = await page.screenshot()
```

Here, the script captures a screenshot of the current view of the page. This is particularly useful for archiving or visual analysis.

#### 3. Defining Images for Analysis

```javascript
defImages(screenshot, { maxWidth: 800 })
```

After capturing the screenshot, this line registers the image for further analysis. `defImages` is a function that makes the screenshot available to subsequent analytical or AI-driven functions in the script.

#### 4. Extracting Text Content

```javascript
const text = parsers.HTMLtoMarkdown(await page.content())
```

This command extracts all text content from the page, which can be invaluable for content audits or textual analysis.

#### 5. Storing Text for Further Use

```javascript
def("PAGE_TEXT", text)
```

The extracted text is then stored under the identifier `PAGE_TEXT`, allowing it to be referenced in later parts of the script or for documentation purposes.

#### 6. Analyzing the Content

```javascript
$`Analyze the content of the page and provide insights.`
```

Finally, this line represents a call to an AI or script-defined function that analyzes the captured content and provides insights. This is where the real power of automation and AI integration into GenAIScript shines, enabling detailed analysis without manual intervention.

### Conclusion

With a simple yet powerful script like the one discussed, GenAIScript makes it feasible to automate the process of web page content analysis. Whether you're conducting competitive analysis, performing content audits, or simply archiving web pages, GenAIScript offers a scalable and efficient solution.
