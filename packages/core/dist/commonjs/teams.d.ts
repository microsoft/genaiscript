import { CancellationOptions } from "./cancellation.js";
import { TraceOptions } from "./trace.js";
/**
 * Converts a Markdown string into HTML formatted for Microsoft Teams.
 *
 * @param markdown - The Markdown content to be converted.
 * Supports headers, lists, links, bold, italic, underlined, code, strikethrough, and blockquotes.
 *
 * @returns An object containing:
 * - `content`: The converted HTML string suitable for Microsoft Teams.
 * - `subject`: The extracted title if available, or undefined.
 */
export declare function convertMarkdownToTeamsHTML(markdown: string): {
  content: string;
  subject: string;
};
export interface MicrosoftTeamsEntity {
  webUrl: string;
  name: string;
}
/**
 * Sends a message to a Microsoft Teams channel, optionally including file attachments.
 *
 * @param channelUrl The URL of the Microsoft Teams channel, in the format https://teams.microsoft.com/l/channel/<channelId>/<channelName>?groupId=<teamId>.
 * @param message The message content to post in Markdown format. It will be converted to HTML.
 * @param options Additional configurations for the message.
 *   - script: The script context to include an attribution footer.
 *   - info: Metadata about the originating script or run (e.g., runUrl).
 *   - files: A list of files to attach to the message. Files are uploaded to the channel's storage.
 *   - folder: The folder in the channel's storage where files will be uploaded, if applicable.
 *   - disclaimer: A disclaimer to append to the message. If a string, it is used directly. Pass false to omit it.
 * @returns A promise resolving to the created message entity containing the message's metadata, including its web URL.
 */
export declare function microsoftTeamsChannelPostMessage(
  channelUrl: string,
  message: string,
  options?: {
    script?: PromptScript;
    info?: {
      runUrl?: string;
    };
    files?: (string | WorkspaceFileWithDescription)[];
    folder?: string;
    disclaimer?: boolean | string;
  } & TraceOptions &
    CancellationOptions,
): Promise<MicrosoftTeamsEntity>;
/**
 * Creates a Microsoft Teams Channel Client for interacting with a Teams channel.
 * This client allows posting messages and managing attachments in the specified channel.
 *
 * @param url The URL of the Microsoft Teams channel. Must be in the format:
 *            `https://teams.microsoft.com/.../channel/<channelId>/<channelName>?groupId=<teamId>`.
 *            If not provided, the function attempts to retrieve the URL from the
 *            GENAISCRIPT_TEAMS_CHANNEL_URL or GENAISCRIPT_TEAMS_URL environment variables.
 *
 * @throws Error if the provided URL is invalid or cannot be parsed.
 *
 * @returns An instance of a MicrosoftTeamsChannelClient for interacting with the specified channel.
 */
export declare function createMicrosoftTeamsChannelClient(url: string): MessageChannelClient;
//# sourceMappingURL=teams.d.ts.map
