# GenAIScript XLSX Package

This package contains Excel spreadsheet (XLSX) processing functionality for GenAIScript, separated from the core runtime package to isolate Excel processing dependencies.

## Purpose

This package was created to:

1. **Remove external CDN dependency**: The core package previously depended on `xlsx` from `https://cdn.sheetjs.com/xlsx-0.20.2/xlsx-0.20.2.tgz`, which could cause installation issues when the CDN was unavailable.

2. **Isolate Excel functionality**: By moving XLSX processing to a separate package, the core runtime is lighter and doesn't include Excel-specific dependencies unless needed.

3. **Use standard npm packages**: This package uses the standard npm `xlsx` package instead of CDN-hosted versions.

## API

The package exports the following functions:

- `XLSXParse(data: Uint8Array, options?: ParseXLSXOptions): Promise<WorkbookSheet[]>` - Parses XLSX data into workbook sheets
- `XLSXTryParse(data: Uint8Array, options?: ParseXLSXOptions): Promise<WorkbookSheet[]>` - Same as XLSXParse but returns empty array on failure

## Types

- `ParseXLSXOptions` - Options for parsing XLSX files (sheet name, range)
- `WorkbookSheet` - Represents a worksheet with name and rows

## Usage

This package is used internally by the GenAIScript core package and is not intended for direct consumption by end users.

## Security Note

The npm `xlsx` package has known vulnerabilities that are fixed in versions > 0.20.2, but these versions are only available via CDN, not npm. This is a limitation of the npm package ecosystem. The vulnerabilities are related to ReDoS and prototype pollution, but the usage within GenAIScript is controlled and limited to parsing trusted files.