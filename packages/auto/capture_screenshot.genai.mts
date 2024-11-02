// Launch a browser instance and navigate to a specified URL
const page = await host.browse('https://example.com');
// Take a screenshot of the current page view
const screenshot = await page.screenshot();
// Register the screenshot for subsequent analysis
defImages(screenshot);
