/**
 * This module provides utilities for processing GitHub Actions workflow files,
 * specifically handling the transformation of labeled/unlabeled triggers with
 * the "names" field into conditional expressions.
 */

import { YAMLParse, YAMLStringify } from "./yaml"

interface GitHubWorkflowTrigger {
    types?: string[]
    names?: string[]
    [key: string]: any
}

interface GitHubWorkflowOn {
    issues?: GitHubWorkflowTrigger
    pull_request?: GitHubWorkflowTrigger
    pull_request_target?: GitHubWorkflowTrigger
    [key: string]: any
}

interface GitHubWorkflowJob {
    if?: string
    [key: string]: any
}

interface GitHubWorkflow {
    on?: GitHubWorkflowOn
    jobs?: Record<string, GitHubWorkflowJob>
    [key: string]: any
}

/**
 * Processes a GitHub Actions workflow to handle the "names" field under
 * labeled/unlabeled triggers. The "names" field is removed from the workflow
 * and converted into conditional if expressions on the jobs.
 *
 * @param workflowYaml - The workflow YAML content as a string
 * @returns The processed workflow YAML as a string
 */
export function processGitHubWorkflow(workflowYaml: string): string {
    const workflow: GitHubWorkflow = YAMLParse(workflowYaml)
    
    if (!workflow.on || !workflow.jobs) {
        return workflowYaml
    }

    // Track which event triggers have names that need to be converted
    const labelConditions: string[] = []
    
    // Process each event type in the "on" section
    for (const [eventKey, eventConfig] of Object.entries(workflow.on)) {
        if (typeof eventConfig === 'object' && eventConfig !== null) {
            const trigger = eventConfig as GitHubWorkflowTrigger
            
            // Check if this trigger has types array containing labeled or unlabeled
            if (trigger.types && trigger.names) {
                const hasLabeledOrUnlabeled = trigger.types.some(
                    (type: string) => type === 'labeled' || type === 'unlabeled'
                )
                
                if (hasLabeledOrUnlabeled) {
                    // Create the conditional expression
                    const namesArray = JSON.stringify(trigger.names)
                    const labelField = 'github.event.label.name'
                    const condition = `contains(fromJSON('${namesArray}'), ${labelField})`
                    labelConditions.push(condition)
                    
                    // Remove the names field from the trigger
                    delete trigger.names
                }
            }
        }
    }
    
    // If we found label conditions, add them to jobs
    if (labelConditions.length > 0) {
        const combinedCondition = labelConditions.join(' || ')
        
        // Add the condition to all jobs
        for (const [jobKey, job] of Object.entries(workflow.jobs)) {
            if (job.if) {
                // Combine with existing condition
                job.if = `(${job.if}) && (${combinedCondition})`
            } else {
                // Add new condition
                job.if = combinedCondition
            }
        }
    }
    
    return YAMLStringify(workflow)
}

/**
 * Processes a GitHub Actions workflow file to handle the "names" field.
 * This is a convenience wrapper around processGitHubWorkflow that handles
 * file input/output.
 *
 * @param workflowContent - The workflow YAML content
 * @returns The processed workflow YAML content
 */
export function transformGitHubWorkflowLabels(workflowContent: string): string {
    return processGitHubWorkflow(workflowContent)
}
