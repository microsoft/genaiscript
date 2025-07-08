import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { remarkDetails } from './remark-details'
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

// Helper function to process markdown with the plugin
function processMarkdown(markdown: string): Node {
  const processor = unified()
    .use(remarkParse)
    .use(remarkDetails)
  
  const tree = processor.parse(markdown)
  return processor.runSync(tree)
}

describe('remark-details plugin', () => {
  
  describe('basic details parsing', () => {
    it('should parse simple details element', () => {
      const markdown = `<details>
<summary>Summary text</summary>
Body content
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 1)
      
      const detailsNode = detailsNodes[0] as any
      assert.equal(detailsNode.type, 'details')
      assert.equal(detailsNode.data?.hName, 'details')
      assert.ok(Array.isArray(detailsNode.children))
    })

    it('should extract summary from details', () => {
      const markdown = `<details>
<summary>Click me</summary>
Content here
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      const detailsNode = detailsNodes[0] as any
      
      const summaryNodes = findNodes(detailsNode, 'summary')
      assert.equal(summaryNodes.length, 1)
      
      const summaryNode = summaryNodes[0] as any
      assert.equal(summaryNode.type, 'summary')
      assert.equal(summaryNode.data?.hName, 'summary')
    })

    it('should preserve content after summary', () => {
      const markdown = `<details>
<summary>Title</summary>
First paragraph

Second paragraph
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      const detailsNode = detailsNodes[0] as any
      
      // Should have summary plus content
      assert.ok(detailsNode.children.length > 1)
      
      // First child should be summary
      const firstChild = detailsNode.children[0]
      assert.equal(firstChild.type, 'summary')
    })
  })

  describe('attributes parsing', () => {
    it('should parse open attribute', () => {
      const markdown = `<details open>
<summary>Open details</summary>
Visible content
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      const detailsNode = detailsNodes[0] as any
      
      assert.equal(detailsNode.data?.hProperties?.open, true)
    })

    it('should handle details without open attribute', () => {
      const markdown = `<details>
<summary>Closed details</summary>
Hidden content
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      const detailsNode = detailsNodes[0] as any
      
      assert.notEqual(detailsNode.data?.hProperties?.open, true)
    })

    it('should handle details with other attributes', () => {
      const markdown = `<details class="my-class" id="my-id">
<summary>Attributed details</summary>
Content
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      // Should still parse successfully even with unknown attributes
      assert.equal(detailsNodes.length, 1)
    })
  })

  describe('nested details', () => {
    it('should handle nested details elements', () => {
      const markdown = `<details>
<summary>Outer</summary>
Before inner
<details>
<summary>Inner</summary>
Inner content
</details>
After inner
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 2)
    })

    it('should handle deeply nested details', () => {
      const markdown = `<details>
<summary>Level 1</summary>
<details>
<summary>Level 2</summary>
<details>
<summary>Level 3</summary>
Deep content
</details>
</details>
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 3)
    })
  })

  describe('edge cases', () => {
    it('should handle details without summary', () => {
      const markdown = `<details>
No summary here
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 1)
      const detailsNode = detailsNodes[0] as any
      
      // Should not have a summary node
      const summaryNodes = findNodes(detailsNode, 'summary')
      assert.equal(summaryNodes.length, 0)
    })

    it('should handle empty details', () => {
      const markdown = `<details>
<summary>Empty</summary>
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 1)
    })

    it('should handle malformed details', () => {
      const markdown = `<details>
<summary>Missing close
Content here`
      
      const tree = processMarkdown(markdown)
      // Should not crash, even if malformed
      assert.ok(tree)
    })

    it('should not interfere with other HTML elements', () => {
      const markdown = `<div>
Regular div content
</div>

<details>
<summary>Details here</summary>
Details content
</details>

<p>Regular paragraph</p>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      const htmlNodes = findNodes(tree, 'html')
      
      assert.equal(detailsNodes.length, 1)
      // Should still have other HTML nodes
      assert.ok(htmlNodes.length > 0)
    })
  })

  describe('markdown content inside details', () => {
    it('should preserve markdown formatting in summary', () => {
      const markdown = `<details>
<summary>**Bold** and *italic*</summary>
Content
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      const detailsNode = detailsNodes[0] as any
      
      const summaryNodes = findNodes(detailsNode, 'summary')
      assert.equal(summaryNodes.length, 1)
      
      // Summary should have child nodes with the markdown content
      const summaryNode = summaryNodes[0] as any
      assert.ok(summaryNode.children.length > 0)
    })

    it('should preserve markdown formatting in details content', () => {
      const markdown = `<details>
<summary>Code example</summary>

\`\`\`javascript
console.log("Hello");
\`\`\`

</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      const detailsNode = detailsNodes[0] as any
      
      // Should contain code block
      const codeNodes = findNodes(detailsNode, 'code')
      assert.ok(codeNodes.length > 0)
    })
  })

  describe('compatibility with existing patterns', () => {
    it('should handle trace-like details structure', () => {
      const markdown = `<details>
<summary>
trace
</summary>
Some trace content
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      
      assert.equal(detailsNodes.length, 1)
      
      const detailsNode = detailsNodes[0] as any
      const summaryNodes = findNodes(detailsNode, 'summary')
      assert.equal(summaryNodes.length, 1)
    })

    it('should handle multi-line summary content', () => {
      const markdown = `<details>
<summary>
Multi
line
summary
</summary>
Body content
</details>`
      
      const tree = processMarkdown(markdown)
      const detailsNodes = findNodes(tree, 'details')
      const detailsNode = detailsNodes[0] as any
      
      const summaryNodes = findNodes(detailsNode, 'summary')
      assert.equal(summaryNodes.length, 1)
    })
  })
})