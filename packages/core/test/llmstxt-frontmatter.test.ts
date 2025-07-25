import { test, expect } from 'vitest'
import { updateFrontmatter } from '../src/frontmatter'

// Test the frontmatter update functionality that our script uses
test('updateFrontmatter adds llmstxt field', () => {
  const markdownContent = `---
title: Test Document
description: A test document
---

# Test Document

This is test content for the document.`

  const expectedOptimizedContent = "Test document covering basic concepts and examples."
  
  const updated = updateFrontmatter(markdownContent, {
    llmstxt: expectedOptimizedContent,
  })

  expect(updated).toContain('llmstxt: Test document covering basic concepts and examples.')
  expect(updated).toContain('title: Test Document')
  expect(updated).toContain('description: A test document')
  expect(updated).toContain('# Test Document')
})

test('updateFrontmatter handles documents without existing frontmatter', () => {
  const markdownContent = `# Test Document

This is test content without frontmatter.`

  const expectedOptimizedContent = "Test document with basic content."
  
  const updated = updateFrontmatter(markdownContent, {
    llmstxt: expectedOptimizedContent,
  })

  expect(updated).toContain('llmstxt: Test document with basic content.')
  expect(updated).toContain('# Test Document')
})

test('updateFrontmatter preserves existing frontmatter when adding llmstxt', () => {
  const markdownContent = `---
title: Existing Document
description: Existing description
sidebar:
  order: 5
keywords:
  - test
  - markdown
---

# Content Here`

  const expectedOptimizedContent = "Optimized content for LLM consumption."
  
  const updated = updateFrontmatter(markdownContent, {
    llmstxt: expectedOptimizedContent,
  })

  // Should preserve all existing fields
  expect(updated).toContain('title: Existing Document')
  expect(updated).toContain('description: Existing description')
  expect(updated).toContain('sidebar:')
  expect(updated).toContain('order: 5')
  expect(updated).toContain('keywords:')
  expect(updated).toContain('- test')
  expect(updated).toContain('- markdown')
  
  // Should add the new field
  expect(updated).toContain('llmstxt: Optimized content for LLM consumption.')
  
  // Should preserve content
  expect(updated).toContain('# Content Here')
})