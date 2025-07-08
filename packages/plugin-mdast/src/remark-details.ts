import { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { Node } from 'unist'
import { unified } from 'unified'
import remarkParse from 'remark-parse'

// MDAST node types
interface DetailsMdastNode extends Node {
  type: 'details'
  data?: {
    hName: string
    hProperties?: Record<string, any>
  }
  children: Array<SummaryMdastNode | Node>
}

interface SummaryMdastNode extends Node {
  type: 'summary'
  data?: {
    hName: string
  }
  children: Node[]
}

interface HtmlNode extends Node {
  type: 'html'
  value: string
}

interface TextNode extends Node {
  type: 'text'
  value: string
}

// Helper function to find the end of a details element considering nesting
function findDetailsEnd(content: string, startPos: number = 0): number {
  let depth = 0
  let pos = startPos
  
  while (pos < content.length) {
    const remaining = content.substring(pos)
    
    // Look for opening and closing details tags
    const openMatch = remaining.match(/^<details(\s+[^>]*)?>/)
    const closeMatch = remaining.match(/^<\/details>/)
    
    if (openMatch) {
      depth++
      pos += openMatch[0].length
    } else if (closeMatch) {
      depth--
      if (depth === 0) {
        return pos + closeMatch[0].length
      }
      pos += closeMatch[0].length
    } else {
      pos++
    }
  }
  
  return -1 // No matching closing tag found
}

// Helper function to parse HTML details content into MDAST nodes
function parseDetailsContent(htmlContent: string): DetailsMdastNode | null {
  // Check if this starts with a details tag
  const detailsStartMatch = htmlContent.match(/^<details(\s+[^>]*)?>/)
  if (!detailsStartMatch) {
    return null
  }
  
  // Find the end of this details element
  const detailsStart = detailsStartMatch[0].length
  const detailsEnd = findDetailsEnd(htmlContent, detailsStart)
  
  if (detailsEnd === -1) {
    return null // No matching closing tag
  }
  
  const attributesStr = detailsStartMatch[1] || ''
  const innerContent = htmlContent.substring(detailsStart, detailsEnd - 10) // Remove </details>
  
  // Parse attributes
  const properties: Record<string, any> = {}
  if (attributesStr.includes('open')) {
    properties.open = true
  }
  
  const detailsNode: DetailsMdastNode = {
    type: 'details',
    data: {
      hName: 'details',
      hProperties: properties
    },
    children: []
  }
  
  // Parse summary and content
  const summaryMatch = innerContent.match(/^[\s\n]*<summary(\s+[^>]*)?>(.+?)<\/summary>[\s\n]*(.*)$/is)
  
  if (summaryMatch) {
    const summaryContent = summaryMatch[2].trim()
    const restContent = summaryMatch[3].trim()
    
    // Create summary node
    const summaryNode: SummaryMdastNode = {
      type: 'summary',
      data: {
        hName: 'summary'
      },
      children: []
    }
    
    // Parse summary content as markdown
    if (summaryContent) {
      try {
        const summaryProcessor = unified().use(remarkParse)
        const summaryTree = summaryProcessor.parse(summaryContent)
        if (summaryTree.type === 'root' && summaryTree.children) {
          // If it's just a paragraph, extract the content
          if (summaryTree.children.length === 1 && summaryTree.children[0].type === 'paragraph') {
            summaryNode.children = (summaryTree.children[0] as any).children || []
          } else {
            summaryNode.children = summaryTree.children as Node[]
          }
        } else {
          summaryNode.children = [{
            type: 'text',
            value: summaryContent
          }]
        }
      } catch (e) {
        // Fallback to text node
        summaryNode.children = [{
          type: 'text',
          value: summaryContent
        }]
      }
    }
    
    detailsNode.children.push(summaryNode)
    
    // Parse rest of content, which might contain nested details
    if (restContent) {
      // First, apply the remarkDetails plugin to handle nested details
      try {
        const contentProcessor = unified().use(remarkParse).use(remarkDetails)
        const contentTree = contentProcessor.parse(restContent)
        const processedTree = contentProcessor.runSync(contentTree)
        if (processedTree.type === 'root' && processedTree.children) {
          detailsNode.children.push(...processedTree.children as Node[])
        } else {
          detailsNode.children.push({
            type: 'text',
            value: restContent
          })
        }
      } catch (e) {
        // Fallback to text node
        detailsNode.children.push({
          type: 'text',
          value: restContent
        })
      }
    }
  } else {
    // No summary, just content - might contain nested details
    try {
      const contentProcessor = unified().use(remarkParse).use(remarkDetails)
      const contentTree = contentProcessor.parse(innerContent.trim())
      const processedTree = contentProcessor.runSync(contentTree)
      if (processedTree.type === 'root' && processedTree.children) {
        detailsNode.children = processedTree.children as Node[]
      } else {
        detailsNode.children = [{
          type: 'text',
          value: innerContent.trim()
        }]
      }
    } catch (e) {
      // Fallback to text node
      detailsNode.children = [{
        type: 'text',
        value: innerContent.trim()
      }]
    }
  }
  
  return detailsNode
}

// Plugin to parse HTML details elements into MDAST nodes
export const remarkDetails: Plugin = function() {
  return (tree: Node) => {
    const replacements: Array<{ parent: any; index: number; node: DetailsMdastNode }> = []
    
    // Find all HTML nodes that contain details elements
    visit(tree, 'html', (node: HtmlNode, index: number | undefined, parent: any) => {
      if (index === undefined || !parent) return
      
      const html = node.value.trim()
      
      // Try to parse as details element
      const detailsNode = parseDetailsContent(html)
      if (detailsNode) {
        replacements.push({ parent, index, node: detailsNode })
      }
    })
    
    // Apply replacements in reverse order to maintain indices
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { parent, index, node } = replacements[i]
      parent.children[index] = node
    }
  }
}

export default remarkDetails