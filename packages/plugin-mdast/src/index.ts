import { unified, Plugin } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRemark from 'rehype-remark'
import rehypeParse from 'rehype-parse'
import { remarkDetails } from './remark-details'

// Using any for Node types to simplify - in real usage, proper unist types would be used
type Node = any

export interface MdastOptions {
  usePlugins?: Plugin[]
  /**
   * Whether to include the built-in remark-details plugin
   * @default true
   */
  includeDetails?: boolean
}

/**
 * Creates an MDAST tree from markdown or HTML content with support for details elements
 * @param content - The markdown or HTML content to parse
 * @param options - Configuration options including plugins
 * @returns The MDAST tree
 */
export function mdast(content: string, options: MdastOptions = {}): Node {
  const { usePlugins = [], includeDetails = true } = options
  
  // Create the processor
  let processor: any = unified().use(remarkParse)
  
  // Add the built-in details plugin if enabled
  if (includeDetails) {
    processor = processor.use(remarkDetails)
  }
  
  // Add user-provided plugins
  for (const plugin of usePlugins) {
    processor = processor.use(plugin)
  }
  
  // Parse the content and return the tree
  const tree = processor.parse(content)
  return processor.runSync(tree)
}

/**
 * Creates an MDAST tree from HTML content specifically
 * @param htmlContent - The HTML content to parse
 * @param options - Configuration options including plugins
 * @returns The MDAST tree
 */
export function mdastFromHtml(htmlContent: string, options: MdastOptions = {}): Node {
  const { usePlugins = [], includeDetails = true } = options
  
  // For HTML content containing details, we can use the same approach as markdown
  // since details elements are already HTML
  let processor: any = unified().use(remarkParse)
  
  // Add the built-in details plugin if enabled
  if (includeDetails) {
    processor = processor.use(remarkDetails)
  }
  
  // Add user-provided plugins
  for (const plugin of usePlugins) {
    processor = processor.use(plugin)
  }
  
  // Parse the content and return the tree
  const tree = processor.parse(htmlContent)
  return processor.runSync(tree)
}

// Re-export the details plugin for direct use
export { remarkDetails } from './remark-details'