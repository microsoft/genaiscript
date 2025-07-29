# Markdown Reference Link Validator

A GenAIScript that validates reference links in Markdown files by checking their reachability and optionally verifying metadata.

## Features

- **Automatic Link Discovery**: Scans Markdown files to find reference link definitions `[label]: url "title"`
- **HTTP Validation**: Checks if links are reachable with proper HTTP status codes
- **Title Verification**: Optionally verifies that page titles match the expected titles in reference definitions
- **Comprehensive Reporting**: Categorizes results into valid links, broken links, and content mismatches
- **CI-Friendly**: Exits with appropriate status codes for integration into CI/CD pipelines
- **Performance Optimized**: Uses caching and configurable concurrency to avoid duplicate requests and rate limiting

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

### Configuration Parameters

The script accepts several parameters to customize its behavior:

```bash
# Set custom timeout (default: 10 seconds)
genaiscript run markdown-link-validator --vars timeout=15

# Limit concurrent requests (default: 5)
genaiscript run markdown-link-validator --vars concurrency=3

# Disable title checking (default: true)
genaiscript run markdown-link-validator --vars checkTitles=false

# Combine multiple parameters
genaiscript run markdown-link-validator \
  --vars timeout=20 \
  --vars concurrency=10 \
  --vars checkTitles=true
```

## Report Format

The script generates a comprehensive report with three main sections:

### ✅ Valid Links
Links that are reachable (HTTP 2xx status) and pass any title verification.

### ❌ Broken/Unreachable Links  
Links that:
- Return HTTP error status codes (4xx, 5xx)
- Time out during the request
- Have invalid URL formats
- Cause network errors

### ⚠️ Content Mismatches
Links that are reachable but whose page titles don't match the expected titles specified in the Markdown reference definitions (only when `checkTitles=true`).

## Example Report

```markdown
# Markdown Reference Link Validation Report

**Summary:** Checked 5 reference links across 3 markdown files.

❌ Found 1 broken links and 1 content mismatches.

## ✅ Valid Links (3)

### README.md
- **[github]** → https://github.com ✅
- **[docs]** → https://docs.example.com ✅

### docs/guide.md  
- **[api]** → https://api.example.com ✅

## ❌ Broken/Unreachable Links (1)

### README.md
- **[broken-link]** → https://nonexistent.example.com - **404 Not Found**

## ⚠️ Content Mismatches (1)

### docs/guide.md
- **[company]** → https://company.com
  - Expected title: "Company Homepage"
  - Actual title: "Company - Building the Future"
```

## CI/CD Integration

The script exits with different status codes for easy CI integration:

- **Exit Code 0**: All links are valid
- **Exit Code 1**: Broken links found (hard failure)
- **Exit Code 0**: Only content mismatches found (warnings, not failures)

This means CI pipelines will fail only on truly broken links, while title mismatches are treated as warnings.

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
- **Concurrency Control**: Configurable concurrent request limit to prevent overwhelming servers
- **Timeouts**: Configurable request timeouts to prevent hanging
- **Rate Limiting**: Batch processing helps avoid rate limiting from external sites

## Error Handling

The script gracefully handles various error conditions:

- **Network Errors**: DNS failures, connection timeouts, etc.
- **HTTP Errors**: 404, 500, and other status codes
- **Invalid URLs**: Malformed or missing URLs
- **HTML Parsing Errors**: Issues extracting page titles

All errors are categorized and reported with descriptive messages.

## Technical Details

- **Language**: TypeScript (ESM)
- **Runtime**: GenAIScript framework
- **Parsing**: Regex-based reference link extraction
- **HTTP Client**: Built-in fetch API with timeout support
- **HTML Processing**: Simple regex-based title extraction

The script prioritizes reliability and simplicity over complex parsing, using robust regex patterns that handle most common Markdown reference link formats.