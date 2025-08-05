import type { Plugin } from "unified";
import type { Node, Root, Blockquote, Data } from "mdast";
declare module "mdast" {
    interface RootContentMap {
        githubAlertMarker: GitHubAlertMarker;
    }
}
/**
 * GitHub alert types supported by the plugin.
 * @see https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
 */
export type GitHubAlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";
/**
 * Extended data interface for GitHub alerts
 */
export interface GitHubAlertNodeData extends Data {
    githubAlert?: {
        type: GitHubAlertType;
        role?: "syntax" | "content";
    };
}
/**
 * Extended blockquote interface with GitHub alert data
 */
export interface GitHubAlertBlockquote extends Blockquote {
    data?: GitHubAlertNodeData;
}
export interface GitHubAlertMarker extends Node {
    type: "githubAlertMarker";
    value: string;
    data?: GitHubAlertNodeData;
}
/**
 * Interface for GitHub alert data
 */
export interface GitHubAlertData {
    type: GitHubAlertType;
    content: string;
}
/**
 * Options for the remark GitHub alerts plugin
 */
export interface RemarkGitHubAlertsOptions {
}
/**
 * Remark plugin that parses GitHub alerts and splits paragraph content into multiple text nodes.
 *
 * GitHub alerts use the syntax:
 * > [!NOTE]
 * > This is a note alert
 *
 * This plugin detects these patterns in the first paragraph of blockquotes and splits
 * the content to separate the alert type from the alert content.
 *
 * @param options Plugin options
 * @returns Unified plugin transformer
 */
declare const remarkGitHubAlerts: Plugin<[RemarkGitHubAlertsOptions?], Root>;
export default remarkGitHubAlerts;
//# sourceMappingURL=remarkalerts.d.ts.map