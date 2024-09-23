const page = await host.browse('https://bing.com');
const screenshot = await page.screenshot();
defImages(screenshot);
const text = parsers.HTMLToMarkdown(await page.content())
def('PAGE_TEXT', text);
$`Analyze the content of the page PAGE_TEXT and provide insights.`;