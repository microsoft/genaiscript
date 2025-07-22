import { describe, it, expect } from 'vitest'
import { OpenAIResponsesModel } from '../src/openai-responses.js'
import { MODEL_PROVIDER_OPENAI_RESPONSES, MODEL_PROVIDER_OPENAI_HOSTS } from '../src/constants.js'

describe('OpenAI Responses Provider', () => {
  it('should have correct model configuration', () => {
    expect(OpenAIResponsesModel).toBeDefined()
    expect(OpenAIResponsesModel.id).toBe('openai_responses')
    expect(OpenAIResponsesModel.completer).toBeDefined()
    expect(OpenAIResponsesModel.embedder).toBeDefined()
  })

  it('should have correct provider constant', () => {
    expect(MODEL_PROVIDER_OPENAI_RESPONSES).toBe('openai_responses')
  })

  it('should be included in OpenAI hosts array', () => {
    expect(MODEL_PROVIDER_OPENAI_HOSTS).toContain(MODEL_PROVIDER_OPENAI_RESPONSES)
  })
})