import { describe, test, expect } from 'vitest'
import { createCopilotPullRequest, GitHubClient } from '../src/githubclient.js'

describe('GitHub createCopilotPullRequest', () => {
  test('function is exported', () => {
    expect(typeof createCopilotPullRequest).toBe('function')
  })

  test('function has correct signature', () => {
    expect(createCopilotPullRequest.length).toBe(3) // title, body, options
  })

  test('GitHubClient has createPullRequest method', () => {
    const client = GitHubClient.default()
    expect(typeof client.createPullRequest).toBe('function')
  })
})