import { describe, test, expect } from 'vitest'
import { GitHubClient } from '../src/githubclient.js'

describe('GitHub createCopilotPullRequest', () => {
  test('GitHubClient has createCopilotPullRequest method', () => {
    const client = GitHubClient.default()
    expect(typeof client.createCopilotPullRequest).toBe('function')
  })

  test('GitHubClient has createPullRequest method', () => {
    const client = GitHubClient.default()
    expect(typeof client.createPullRequest).toBe('function')
  })
})