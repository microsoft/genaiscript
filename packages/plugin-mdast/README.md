# GenAIScript MDAST Plugin

A remark plugin for parsing HTML details elements into MDAST (Markdown Abstract Syntax Tree) nodes.

## Features

- 🔧 Parses HTML `<details>` and `<summary>` elements into proper MDAST nodes
- 🔄 Supports nested details elements
- 📝 Preserves markdown content inside details blocks
- 🎛️ Configurable plugin system with `usePlugins` support
- ✅ Handles both complete and fragmented HTML details structures
- 🧪 Comprehensive test coverage

## Installation

```bash
pnpm install
```

## Usage

### Basic Usage

```typescript
import { mdast, remarkDetails } from './src/index'

// Parse markdown with details elements
const markdown = `
<details>
<summary>Click to expand</summary>
This is the content inside the details element.
</details>
`

const tree = mdast(markdown)
console.log(tree)
```

### Using with Custom Plugins

```typescript
import { mdast } from './src/index'
import someRemarkPlugin from 'some-remark-plugin'

const tree = mdast(markdown, {
  usePlugins: [someRemarkPlugin],
  includeDetails: true // enabled by default
})
```

### Parsing HTML Content

```typescript
import { mdastFromHtml } from './src/index'

const html = `
<details>
<summary>HTML Summary</summary>
<p>HTML content</p>
</details>
`

const tree = mdastFromHtml(html)
```

### Using the Plugin Directly

```typescript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { remarkDetails } from './src/index'

const processor = unified()
  .use(remarkParse)
  .use(remarkDetails)

const tree = processor.parse(markdown)
const result = processor.runSync(tree)
```

## MDAST Output Structure

The plugin converts HTML details elements into MDAST nodes with the following structure:

```javascript
{
  type: 'details',
  data: {
    hName: 'details',
    hProperties: { open: true } // if open attribute is present
  },
  children: [
    {
      type: 'summary',
      data: { hName: 'summary' },
      children: [/* summary content */]
    },
    // ... other content nodes
  ]
}
```

## Supported Features

### Basic Details

```html
<details>
<summary>Summary text</summary>
Content goes here
</details>
```

### Details with `open` Attribute

```html
<details open>
<summary>Always visible</summary>
This content is visible by default
</details>
```

### Nested Details

```html
<details>
<summary>Outer details</summary>
Some content
<details>
<summary>Inner details</summary>
Nested content
</details>
More content
</details>
```

### Details with Markdown Content

```html
<details>
<summary>**Bold** summary with *formatting*</summary>

```javascript
function example() {
  return "Hello World";
}
```

More markdown content here.
</details>
```

## API

### `mdast(content: string, options?: MdastOptions): Node`

Creates an MDAST tree from markdown content with details element support.

### `mdastFromHtml(htmlContent: string, options?: MdastOptions): Node`

Creates an MDAST tree from HTML content with details element support.

### `remarkDetails: Plugin`

The remark plugin that can be used directly with unified processors.

### `MdastOptions`

```typescript
interface MdastOptions {
  usePlugins?: Plugin[]
  includeDetails?: boolean // default: true
}
```

## Testing

Run the test suite:

```bash
pnpm test
```

All tests are written using Node.js built-in test runner and include comprehensive coverage of:

- Basic details parsing
- Nested details structures
- Attribute handling (open, etc.)
- Markdown content preservation
- Edge cases and error handling
- Integration with existing patterns

## Compatibility

This plugin is designed to work with:

- remark v15+
- unified v11+
- Node.js 16+

## License

MIT