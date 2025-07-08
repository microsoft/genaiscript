import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mdast, mdastFromHtml, remarkDetails, type MdastOptions } from './index'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import { Node } from 'unist'

// Helper function to find nodes of a specific type
function findNodes(tree: Node, type: string): Node[] {
  const nodes: Node[] = []
  visit(tree, type, (node: Node) => {
    nodes.push(node)
  })
  return nodes
}

describe('mdast details plugin', () => {
  
  describe('remarkDetails plugin', () => {
    it('should parse basic details element', () => {
      const markdown = `
<details>
<summary>Click to expand</summary>
Content inside details
</details>
`
      
      const tree = unified()
        .use(remarkParse)
        .use(remarkDetails)
        .parse(markdown)
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkDetails)
      
      const result = processor.runSync(tree)
      const detailsNodes = findNodes(result, 'details')
      
      assert.equal(detailsNodes.length, 1)
      const detailsNode = detailsNodes[0] as any
      assert.equal(detailsNode.type, 'details')
      assert.ok(detailsNode.children)
      
      // Should have summary as first child
      const summaryNodes = findNodes(detailsNode, 'summary')
      assert.equal(summaryNodes.length, 1)
    })

    it('should parse details element with open attribute', () => {
      const markdown = `
<details open>
<summary>Already expanded</summary>
This is visible by default
</details>
`
      
      const tree = unified()
        .use(remarkParse)
        .use(remarkDetails)
        .parse(markdown)
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkDetails)
      
      const result = processor.runSync(tree)
      const detailsNodes = findNodes(result, 'details')
      
      assert.equal(detailsNodes.length, 1)
      const detailsNode = detailsNodes[0] as any
      assert.equal(detailsNode.data?.hProperties?.open, true)
    })

    it('should handle nested details elements', () => {
      const markdown = `
<details>
<summary>Outer details</summary>
Some content
<details>
<summary>Inner details</summary>
Nested content
</details>
More content
</details>
`
      
      const tree = unified()
        .use(remarkParse)
        .use(remarkDetails)
        .parse(markdown)
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkDetails)
      
      const result = processor.runSync(tree)
      const detailsNodes = findNodes(result, 'details')
      
      assert.equal(detailsNodes.length, 2) // Should find both outer and inner
    })

    it('should preserve other markdown content', () => {
      const markdown = `
# Title

Some text before

<details>
<summary>Details section</summary>
Details content
</details>

Some text after
`
      
      const tree = unified()
        .use(remarkParse)
        .use(remarkDetails)
        .parse(markdown)
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkDetails)
      
      const result = processor.runSync(tree)
      
      // Should have heading, paragraphs, and details
      const headingNodes = findNodes(result, 'heading')
      const detailsNodes = findNodes(result, 'details')
      
      assert.equal(headingNodes.length, 1)
      assert.equal(detailsNodes.length, 1)
    })

    it('should handle summary with complex content', () => {
      const markdown = `
<details>
<summary>**Bold** and *italic* text</summary>
Content here
</details>
`
      
      const tree = unified()
        .use(remarkParse)
        .use(remarkDetails)
        .parse(markdown)
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkDetails)
      
      const result = processor.runSync(tree)
      const detailsNodes = findNodes(result, 'details')
      
      assert.equal(detailsNodes.length, 1)
      const detailsNode = detailsNodes[0] as any
      const summaryNodes = findNodes(detailsNode, 'summary')
      assert.equal(summaryNodes.length, 1)
    })
  })

  describe('mdast function', () => {
    it('should create MDAST tree from markdown with details', () => {
      const markdown = `
<details>
<summary>Test Summary</summary>
Test content
</details>
`
      
      const tree = mdast(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 1)
      const detailsNode = detailsNodes[0] as any
      assert.equal(detailsNode.type, 'details')
      assert.ok(detailsNode.children)
    })

    it('should allow disabling details plugin', () => {
      const markdown = `
<details>
<summary>Test Summary</summary>
Test content
</details>
`
      
      const tree = mdast(markdown, { includeDetails: false })
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 0) // Should not parse details when disabled
    })

    it('should accept custom plugins via usePlugins', () => {
      // Simple test plugin that adds a custom property
      const testPlugin = () => (tree: Node) => {
        (tree as any).testProperty = 'added by plugin'
      }
      
      const markdown = `# Test`
      const tree = mdast(markdown, { usePlugins: [testPlugin] }) as any
      
      assert.equal(tree.testProperty, 'added by plugin')
    })

    it('should work with empty content', () => {
      const tree = mdast('')
      assert.ok(tree)
      assert.equal(tree.type, 'root')
    })

    it('should work with only text content', () => {
      const tree = mdast('Just some text')
      assert.ok(tree)
      assert.equal(tree.type, 'root')
    })
  })

  describe('mdastFromHtml function', () => {
    it('should create MDAST tree from HTML with details', () => {
      const html = `
<details>
<summary>HTML Summary</summary>
<p>HTML content</p>
</details>
`
      
      const tree = mdastFromHtml(html)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 1)
    })

    it('should handle plain HTML content', () => {
      const html = `<div><p>Simple HTML</p></div>`
      
      const tree = mdastFromHtml(html)
      assert.ok(tree)
      assert.equal(tree.type, 'root')
    })
  })

  describe('integration with existing details patterns', () => {
    it('should parse details similar to traceparser format', () => {
      const markdown = `
<details>
<summary>trace</summary>
Some trace content
<details>
<summary>nested trace</summary>
Nested content
</details>
</details>
`
      
      const tree = mdast(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 2)
      
      // Check that the structure matches expectations
      const rootDetails = detailsNodes[0] as any
      const summaryNodes = findNodes(rootDetails, 'summary')
      assert.equal(summaryNodes.length, 1)
    })

    it('should handle details with markdown content inside', () => {
      const markdown = `
<details>
<summary>Code Example</summary>

\`\`\`javascript
function example() {
  return "Hello World";
}
\`\`\`

</details>
`
      
      const tree = mdast(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 1)
      const detailsNode = detailsNodes[0] as any
      
      // Should contain code block inside
      const codeNodes = findNodes(detailsNode, 'code')
      assert.ok(codeNodes.length > 0)
    })
  })
})