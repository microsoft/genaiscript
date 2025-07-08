import { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { unified } from 'unified'
import remarkParse from 'remark-parse'

// Using any for Node types to simplify - in real usage, proper unist types would be used
type Node = any

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

// Helper function to balance details tags and extract the outermost one
function extractOutermostDetails(htmlContent: string): { match: string; rest: string } | null {
  const lines = htmlContent.split('\n')
  let depth = 0
  let startLine = -1
  let endLine = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check for details opening tag
    if (line.match(/^<details(\s+[^>]*)?>$/)) {
      if (depth === 0) {
        startLine = i
      }
      depth++
    }
    // Check for details closing tag
    else if (line.match(/^<\/details>$/)) {
      depth--
      if (depth === 0 && startLine !== -1) {
        endLine = i
        break
      }
    }
  }
  
  if (startLine !== -1 && endLine !== -1) {
    const matchedLines = lines.slice(startLine, endLine + 1)
    const restLines = lines.slice(endLine + 1)
    
    return {
      match: matchedLines.join('\n'),
      rest: restLines.join('\n').trim()
    }
  }
  
  // Fallback: try to match complete details in the content
  const match = htmlContent.match(/^<details(\s+[^>]*)?>[\s\S]*?<\/details>/)
  if (match) {
    return {
      match: match[0],
      rest: htmlContent.substring(match[0].length).trim()
    }
  }
  
  return null
}

// Helper function to parse HTML details content into MDAST nodes
function parseDetailsContent(htmlContent: string): DetailsMdastNode | null {
  const extraction = extractOutermostDetails(htmlContent)
  if (!extraction) {
    return null
  }
  
  const { match: detailsBlock } = extraction
  
  // Extract details attributes
  const detailsStartMatch = detailsBlock.match(/^<details(\s+[^>]*)?>/)
  if (!detailsStartMatch) {
    return null
  }
  
  const attributesStr = detailsStartMatch[1] || ''
  const properties: Record<string, any> = {}
  if (attributesStr.includes('open')) {
    properties.open = true
  }
  
  // Extract inner content (everything between <details> and </details>)
  const innerMatch = detailsBlock.match(/^<details[^>]*>([\s\S]*)<\/details>$/)
  if (!innerMatch) {
    return null
  }
  
  const innerContent = innerMatch[1]
  
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
    
    // Parse rest of content which might contain nested details or other markdown
    if (restContent) {
      try {
        // Don't recursively apply the plugin to avoid infinite loops
        const contentProcessor = unified().use(remarkParse)
        const contentTree = contentProcessor.parse(restContent)
        if (contentTree.type === 'root' && contentTree.children) {
          detailsNode.children.push(...contentTree.children as Node[])
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
    // No summary, just content
    try {
      const contentProcessor = unified().use(remarkParse)
      const contentTree = contentProcessor.parse(innerContent.trim())
      if (contentTree.type === 'root' && contentTree.children) {
        detailsNode.children = contentTree.children as Node[]
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
    let hasChanges = true
    let iterations = 0
    const maxIterations = 10 // Prevent infinite loops
    
    // Keep applying transformations until no more details elements are found
    while (hasChanges && iterations < maxIterations) {
      hasChanges = false
      iterations++
      
      // Handle both complete details blocks and fragmented ones
      const replacements: Array<{ 
        parent: any; 
        startIndex: number; 
        endIndex: number; 
        nodes: Node[] 
      }> = []
      
      // First, try to find complete details blocks
      visit(tree, 'html', (node: HtmlNode, index: number | undefined, parent: any) => {
        if (index === undefined || !parent) return
        
        const html = node.value.trim()
        const resultNodes: Node[] = []
        let remainingHtml = html
        
        // Extract all details elements from this HTML block
        while (remainingHtml) {
          const detailsNode = parseDetailsContent(remainingHtml)
          if (detailsNode) {
            resultNodes.push(detailsNode)
            hasChanges = true
            
            // Find what's left after this details element
            const extraction = extractOutermostDetails(remainingHtml)
            if (extraction && extraction.rest) {
              remainingHtml = extraction.rest
            } else {
              break
            }
          } else {
            // No more details elements, keep remaining HTML as-is
            if (remainingHtml.trim()) {
              resultNodes.push({
                type: 'html',
                value: remainingHtml
              })
            }
            break
          }
        }
        
        // If we found any details nodes, replace the original HTML node
        if (resultNodes.length > 0 && hasChanges) {
          replacements.push({ 
            parent, 
            startIndex: index, 
            endIndex: index, 
            nodes: resultNodes 
          })
        }
      })
      
      // Now handle fragmented details (opening tag separate from closing tag)
      if (!hasChanges) {
        for (let i = 0; i < (tree as any).children?.length; i++) {
          const children = (tree as any).children
          if (!children) continue
          
          const node = children[i]
          if (node?.type === 'html') {
            const html = node.value.trim()
            
            // Check if this is an opening details tag
            const detailsOpenMatch = html.match(/^<details(\s+[^>]*)?>[\s\S]*?<summary(\s+[^>]*)?>(.*)$/is)
            if (detailsOpenMatch) {
              // Found opening details with summary - now find the closing tag
              const attributesStr = detailsOpenMatch[1] || ''
              const summaryContent = detailsOpenMatch[3].trim()
              
              let endIndex = -1
              const collectedNodes: Node[] = []
              
              // Look for </summary> first
              let summaryEnded = false
              let j = i + 1
              
              // If summary content is not complete in the opening tag, collect until </summary>
              if (!summaryContent.includes('</summary>')) {
                while (j < children.length) {
                  const nextNode = children[j]
                  if (nextNode?.type === 'html' && nextNode.value.includes('</summary>')) {
                    const summaryEndContent = nextNode.value.split('</summary>')[0]
                    if (summaryEndContent) {
                      collectedNodes.push({
                        type: 'text',
                        value: summaryEndContent
                      })
                    }
                    summaryEnded = true
                    
                    // Check if there's content after </summary> in the same node
                    const afterSummary = nextNode.value.split('</summary>')[1]
                    if (afterSummary && afterSummary.trim()) {
                      if (afterSummary.includes('</details>')) {
                        // End of details in same node
                        const beforeDetails = afterSummary.split('</details>')[0]
                        if (beforeDetails.trim()) {
                          collectedNodes.push({
                            type: 'text',
                            value: beforeDetails.trim()
                          })
                        }
                        endIndex = j
                        break
                      } else {
                        collectedNodes.push({
                          type: 'text',
                          value: afterSummary
                        })
                      }
                    }
                    j++
                    break
                  } else {
                    collectedNodes.push(nextNode)
                    j++
                  }
                }
              } else {
                summaryEnded = true
              }
              
              // Now look for </details>
              if (summaryEnded) {
                while (j < children.length) {
                  const nextNode = children[j]
                  if (nextNode?.type === 'html' && nextNode.value.includes('</details>')) {
                    endIndex = j
                    
                    // Get content before </details>
                    const beforeDetails = nextNode.value.split('</details>')[0]
                    if (beforeDetails.trim()) {
                      collectedNodes.push({
                        type: 'text',
                        value: beforeDetails.trim()
                      })
                    }
                    break
                  } else {
                    collectedNodes.push(nextNode)
                    j++
                  }
                }
              }
              
              // If we found a complete details structure, create the details node
              if (endIndex !== -1) {
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
                  children: [
                    {
                      type: 'summary',
                      data: {
                        hName: 'summary'
                      },
                      children: summaryContent ? [{
                        type: 'text',
                        value: summaryContent
                      }] : []
                    },
                    ...collectedNodes
                  ]
                }
                
                replacements.push({
                  parent: tree,
                  startIndex: i,
                  endIndex: endIndex,
                  nodes: [detailsNode]
                })
                
                hasChanges = true
                break // Process one at a time to avoid index issues
              }
            }
          }
        }
      }
      
      // Apply replacements in reverse order to maintain indices
      for (let i = replacements.length - 1; i >= 0; i--) {
        const { parent, startIndex, endIndex, nodes } = replacements[i]
        const deleteCount = endIndex - startIndex + 1
        parent.children.splice(startIndex, deleteCount, ...nodes)
      }
    }
  }
}

export default remarkDetails