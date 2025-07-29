# Markdown Reference Link Validator

A GenAIScript that validates reference links in Markdown files by checking their reachability.

## Features

- **Automatic Link Discovery**: Scans Markdown files to find reference link definitions `[label]: url "title"`
- **HTTP Validation**: Checks if links are reachable with proper HTTP status codes
- **Comprehensive Reporting**: Categorizes results into valid links and broken links
- **CI-Friendly**: Exits with appropriate status codes for integration into CI/CD pipelines
- **Simple and Focused**: Sequential validation without complex concurrent processing

## Usage

### Basic Usage

```bash
# Validate all markdown files in the repository
genaiscript run markdown-link-validator

# Validate specific files
genaiscript run markdown-link-validator README.md docs/*.md

# Validate with custom output directory
genaiscript run markdown-link-validator --out results/
```

The script uses a default timeout of 10 seconds for HTTP requests and processes links sequentially for simplicity and reliability.

## Report Format

The script generates a comprehensive report with two main sections:

### ✅ Valid Links
Links that are reachable (HTTP 2xx status).

### ❌ Broken/Unreachable Links  
Links that:
- Return HTTP error status codes (4xx, 5xx)
- Time out during the request
- Have invalid URL formats
- Cause network errors

## Example Report

```markdown
# Markdown Reference Link Validation Report

**Summary:** Checked 4 reference links across 3 markdown files.

❌ Found 1 broken links.

## ✅ Valid Links (3)

### README.md
- **[github]** → https://github.com ✅
- **[docs]** → https://docs.example.com ✅

### docs/guide.md  
- **[api]** → https://api.example.com ✅

## ❌ Broken/Unreachable Links (1)

### README.md
- **[broken-link]** → https://nonexistent.example.com - **404 Not Found**
```

## CI/CD Integration

The script exits with different status codes for easy CI integration:

- **Exit Code 0**: All links are valid
- **Exit Code 1**: Broken links found

## Supported Link Types

The validator supports various types of reference links:

```markdown
[http-link]: https://example.com "Optional Title"
[https-link]: https://secure.example.com  
[relative-path]: ./docs/guide.md
[absolute-path]: /docs/api.md
[domain-only]: example.com
```

**Note**: Only HTTP/HTTPS links undergo network validation. Relative paths and other schemes are marked as valid without network checks.

## Performance Considerations

- **Caching**: URLs are cached to avoid duplicate requests when the same URL appears multiple times
- **Sequential Processing**: Links are validated one at a time for simplicity and reliability
- **Timeouts**: Fixed 10-second request timeout to prevent hanging

## Error Handling

The script gracefully handles various error conditions:

- **Network Errors**: DNS failures, connection timeouts, etc.
- **HTTP Errors**: 404, 500, and other status codes
- **Invalid URLs**: Malformed or missing URLs

All errors are categorized and reported with descriptive messages.

## Technical Details

- **Language**: TypeScript (ESM)
- **Runtime**: GenAIScript framework
- **Parsing**: Regex-based reference link extraction
- **HTTP Client**: Built-in fetch API with timeout support

The script prioritizes reliability and simplicity over complex parsing, using robust regex patterns that handle most common Markdown reference link formats.