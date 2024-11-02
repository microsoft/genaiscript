// Launch a browser instance and navigate to a specified URL
const page = await host.browse('https://example.com');
// Select a table element on the page by its test-id
const table = page.locator('table[data-testid="data-table"]');
// Convert the HTML of the table into Markdown format
const markdownTable = await parsers.HTMLToMarkdown(await table.innerHTML());
// Define the converted table for further processing
def('TABLE_MARKDOWN', markdownTable);
