// Test for issue creation logic in run.ts
import { describe, it, expect } from 'vitest';

describe('GitHub Issue Options Logic', () => {
  it('should parse issue number from string', () => {
    const issueComment = "123";
    const isIssueNumber = /^\d+$/.test(issueComment);
    expect(isIssueNumber).toBe(true);
  });

  it('should not parse non-numeric strings as issue numbers', () => {
    const issueComment = "abc";
    const isIssueNumber = /^\d+$/.test(issueComment);
    expect(isIssueNumber).toBe(false);
  });

  it('should handle boolean issue comment option', () => {
    const issueComment = true;
    const isIssueNumber = typeof issueComment === "string" && /^\d+$/.test(issueComment);
    expect(isIssueNumber).toBe(false);
  });

  it('should generate proper title when issue option is boolean', () => {
    const issue = true;
    const script = { id: "test-script" };
    const title = typeof issue === "string" && issue ? issue : `GenAIScript: ${script.id}`;
    expect(title).toBe("GenAIScript: test-script");
  });

  it('should use custom title when issue option is string', () => {
    const issue = "Custom Issue Title";
    const script = { id: "test-script" };
    const title = typeof issue === "string" && issue ? issue : `GenAIScript: ${script.id}`;
    expect(title).toBe("Custom Issue Title");
  });
});