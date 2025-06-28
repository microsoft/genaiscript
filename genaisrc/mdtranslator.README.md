# MD Translator with Link Validation

A GenAIScript for translating Markdown documents while ensuring all links are preserved exactly as they are.

## Features

### 🔗 Comprehensive Link Validation
- **QA Step**: Validates links before the classify step to ensure translation quality
- **Link Preservation**: Ensures no links are added, modified, or removed during translation
- **Smart Detection**: Handles both inline `[text](url)` and reference `[ref]: url` links
- **Code Block Awareness**: Properly excludes links inside code blocks and inline code

### 🌍 Multi-Language Support
- Supports multiple target languages via `--vars lang=XX` parameter
- Default languages: French (fr), Spanish (es), German (de), Italian (it), Portuguese (pt), Japanese (ja), Korean (ko), Chinese (zh)
- Easy to extend with additional languages

### 🔄 Automatic Error Recovery
- **Validation Failures**: Automatically attempts to fix translations that fail link validation
- **Detailed Feedback**: Provides specific error messages about missing or added links
- **Manual Review**: Falls back to manual review for persistent validation failures

### 📊 Quality Assurance Process
1. **Link Extraction**: Identifies all links in the original document
2. **Translation**: Translates content while preserving link structure
3. **Link Validation**: Compares original vs translated links
4. **Auto-Fix**: Attempts to correct validation failures
5. **Classification**: Classifies document type only after successful validation

## Usage

### Basic Translation
```bash
genaiscript run mdtranslator document.md --vars lang=fr
```

### Multiple Files
```bash
genaiscript run mdtranslator *.md --vars lang=de
```

### With Custom Language
```bash
genaiscript run mdtranslator docs/ --vars lang=es
```

## Link Validation Details

### What's Validated
- ✅ All original URLs are preserved
- ✅ No new URLs are introduced
- ✅ Link frequency is maintained (duplicate URLs handled correctly)
- ✅ Both inline and reference links are checked
- ✅ Line numbers provided for debugging

### What's Ignored
- Links inside fenced code blocks (```)
- Links inside inline code (`text`)
- Malformed links that aren't valid markdown

### Validation Examples

#### ✅ Good Translation
**Original:**
```markdown
Check out [GenAIScript](https://microsoft.github.io/genaiscript/) for more info.
```

**Translation:**
```markdown
Consultez [GenAIScript](https://microsoft.github.io/genaiscript/) pour plus d'informations.
```

#### ❌ Bad Translation (Missing Link)
**Original:**
```markdown
Visit [GitHub](https://github.com) and [Microsoft](https://microsoft.com).
```

**Translation:**
```markdown
Visitez GitHub et [Microsoft](https://microsoft.com).
```

## Error Messages

### Missing URLs
```
Missing URLs in translation: https://github.com
```

### Added URLs
```
Unexpected new URLs in translation: https://newsite.com
```

### Frequency Mismatch
```
URL "https://example.com" appears 2 times in original but 1 times in translation
```

## Output

The script generates:
- Translated markdown files with preserved links
- Detailed validation reports
- Classification of document type
- Error logs for manual review when needed

## Integration

This script can be integrated into documentation workflows to ensure:
- Translation quality through link preservation
- Automated QA processes
- Consistent documentation structure across languages
- Reduced manual review overhead

## Technical Implementation

### Link Extraction Algorithm
1. **Code Block Detection**: Tracks ```-fenced code blocks
2. **Inline Code Handling**: Uses backtick counting to avoid inline code
3. **Regex Patterns**: Robust patterns for both link types
4. **Line Tracking**: Provides line numbers for debugging

### Validation Process
1. **URL Set Comparison**: Uses Sets for efficient URL comparison
2. **Frequency Analysis**: Maps to track URL occurrence counts
3. **Detailed Reporting**: Comprehensive analysis of differences
4. **Recovery Mechanism**: Structured retry with specific feedback

This ensures that translated documentation maintains all link integrity while providing natural language translations.