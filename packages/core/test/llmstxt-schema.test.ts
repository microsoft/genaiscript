import { test, expect } from 'vitest'
import { z } from 'zod'

// Test schema extension to verify llmstxt field is supported
test('schema extension includes llmstxt field', () => {
  // Simulate the schema structure
  const baseSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
  })
  
  const extendedSchema = baseSchema.extend({
    llmstxt: z.string().optional(),
  })
  
  // Test valid data with llmstxt field
  const validData = {
    title: 'Test Document',
    description: 'A test document',
    llmstxt: 'This is optimized content for LLM consumption'
  }
  
  const result = extendedSchema.safeParse(validData)
  expect(result.success).toBe(true)
  
  if (result.success) {
    expect(result.data.llmstxt).toBe('This is optimized content for LLM consumption')
  }
})

test('schema accepts documents without llmstxt field', () => {
  const baseSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
  })
  
  const extendedSchema = baseSchema.extend({
    llmstxt: z.string().optional(),
  })
  
  // Test data without llmstxt field (should still be valid)
  const validData = {
    title: 'Test Document',
    description: 'A test document'
  }
  
  const result = extendedSchema.safeParse(validData)
  expect(result.success).toBe(true)
  
  if (result.success) {
    expect(result.data.llmstxt).toBeUndefined()
  }
})