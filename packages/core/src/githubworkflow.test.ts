import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { processGitHubWorkflow } from "./githubworkflow"
import { YAMLParse } from "./yaml"

describe("GitHubWorkflow", () => {
    describe("processGitHubWorkflow", () => {
        test("should handle labeled event with names field", () => {
            const input = `name: Test Workflow
on:
  issues:
    types: [labeled]
    names: [bug, enhancement]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`
            const result = processGitHubWorkflow(input)
            const workflow = YAMLParse(result)
            
            // Names field should be removed
            assert.strictEqual(workflow.on.issues.names, undefined)
            
            // Job should have if condition
            assert.ok(workflow.jobs.test.if)
            assert.ok(workflow.jobs.test.if.includes('github.event.label.name'))
            assert.ok(workflow.jobs.test.if.includes('bug'))
            assert.ok(workflow.jobs.test.if.includes('enhancement'))
        })
        
        test("should handle unlabeled event with names field", () => {
            const input = `name: Test Workflow
on:
  issues:
    types: [unlabeled]
    names: [wontfix]
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - run: echo "cleanup"
`
            const result = processGitHubWorkflow(input)
            const workflow = YAMLParse(result)
            
            // Names field should be removed
            assert.strictEqual(workflow.on.issues.names, undefined)
            
            // Job should have if condition
            assert.ok(workflow.jobs.cleanup.if)
            assert.ok(workflow.jobs.cleanup.if.includes('wontfix'))
        })
        
        test("should handle both labeled and unlabeled in same trigger", () => {
            const input = `name: Test Workflow
on:
  issues:
    types: [labeled, unlabeled]
    names: [bug, feature]
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - run: echo "process"
`
            const result = processGitHubWorkflow(input)
            const workflow = YAMLParse(result)
            
            // Names field should be removed
            assert.strictEqual(workflow.on.issues.names, undefined)
            
            // Job should have if condition
            assert.ok(workflow.jobs.process.if)
            assert.ok(workflow.jobs.process.if.includes('bug'))
            assert.ok(workflow.jobs.process.if.includes('feature'))
        })
        
        test("should preserve existing if conditions", () => {
            const input = `name: Test Workflow
on:
  issues:
    types: [labeled]
    names: [critical]
jobs:
  alert:
    runs-on: ubuntu-latest
    if: github.repository == 'owner/repo'
    steps:
      - run: echo "alert"
`
            const result = processGitHubWorkflow(input)
            const workflow = YAMLParse(result)
            
            // Job should have combined if condition
            assert.ok(workflow.jobs.alert.if)
            assert.ok(workflow.jobs.alert.if.includes('github.repository'))
            assert.ok(workflow.jobs.alert.if.includes('critical'))
            assert.ok(workflow.jobs.alert.if.includes('&&'))
        })
        
        test("should not modify workflow without names field", () => {
            const input = `name: Test Workflow
on:
  issues:
    types: [labeled]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`
            const result = processGitHubWorkflow(input)
            const workflow = YAMLParse(result)
            
            // Job should not have if condition added
            assert.strictEqual(workflow.jobs.test.if, undefined)
        })
        
        test("should not modify workflow without labeled/unlabeled types", () => {
            const input = `name: Test Workflow
on:
  issues:
    types: [opened]
    names: [something]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`
            const result = processGitHubWorkflow(input)
            const workflow = YAMLParse(result)
            
            // Names field should still be there (not removed)
            // because it's not on a labeled/unlabeled trigger
            assert.deepStrictEqual(workflow.on.issues.names, ['something'])
            
            // Job should not have if condition added
            assert.strictEqual(workflow.jobs.test.if, undefined)
        })
        
        test("should handle multiple jobs", () => {
            const input = `name: Test Workflow
on:
  issues:
    types: [labeled]
    names: [urgent]
jobs:
  job1:
    runs-on: ubuntu-latest
    steps:
      - run: echo "job1"
  job2:
    runs-on: ubuntu-latest
    steps:
      - run: echo "job2"
`
            const result = processGitHubWorkflow(input)
            const workflow = YAMLParse(result)
            
            // Both jobs should have if condition
            assert.ok(workflow.jobs.job1.if)
            assert.ok(workflow.jobs.job1.if.includes('urgent'))
            assert.ok(workflow.jobs.job2.if)
            assert.ok(workflow.jobs.job2.if.includes('urgent'))
        })
        
        test("should handle pull_request events", () => {
            const input = `name: Test Workflow
on:
  pull_request:
    types: [labeled]
    names: [approved]
jobs:
  merge:
    runs-on: ubuntu-latest
    steps:
      - run: echo "merge"
`
            const result = processGitHubWorkflow(input)
            const workflow = YAMLParse(result)
            
            // Names field should be removed
            assert.strictEqual(workflow.on.pull_request.names, undefined)
            
            // Job should have if condition
            assert.ok(workflow.jobs.merge.if)
            assert.ok(workflow.jobs.merge.if.includes('approved'))
        })
    })
})
