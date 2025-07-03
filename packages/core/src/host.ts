// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CancellationOptions, CancellationToken } from "./cancellation.js";
import { LanguageModel } from "./chat.js";
import { Progress } from "./progress.js";
import { MarkdownTrace, TraceOptions } from "./trace.js";
import {
  AzureCredentialsType,
  LanguageModelConfiguration,
  LogLevel,
  Project,
  ResponseStatus,
} from "./server/messages.js";
import { HostConfiguration } from "./hostconfiguration.js";
import { LOG } from "./constants.js";
import type { TokenCredential } from "@azure/identity";
import { McpClientManager } from "./mcpclient.js";
import { ResourceManager } from "./mcpresource.js";
import type {
  BrowserPage,
  BrowseSessionOptions,
  ContainerHost,
  ContainerOptions,
  ContentSafety,
  ContentSafetyProvider,
  ModelOptions,
  Path,
  PythonRuntime,
  PythonRuntimeOptions,
  SerializedError,
  ShellOutput,
  ShellSelectChoice,
  ShellSelectOptions,
  ShellInputOptions,
  ShellConfirmOptions,
  ShellOptions,
  WorkspaceFile,
  WorkspaceFileSystem,
  WorkspaceFileWithScore,
  VectorSearchOptions,
} from "./types.js";
import { genaiscriptDebug } from "./debug.js";
import { resolveGlobal } from "./global.js";
const dbg = genaiscriptDebug("host");

export class LogEvent extends Event {
  static Name = "log";
  constructor(
    public readonly level: LogLevel,
    public readonly message: string,
  ) {
    super(LOG);
  }
}

// this is typically an instance of TextDecoder
export interface UTF8Decoder {
  decode(
    input: Uint8Array,
    options?: {
      stream?: boolean | undefined;
    },
  ): string;
}

export interface UTF8Encoder {
  encode(input: string): Uint8Array;
}

export interface RetrievalClientOptions {
  progress?: Progress;
  token?: CancellationToken;
  trace?: MarkdownTrace;
}

export interface RetrievalSearchOptions extends VectorSearchOptions {}

export interface RetrievalSearchResponse extends ResponseStatus {
  results: WorkspaceFileWithScore[];
}

export interface RetrievalService {
  vectorSearch(
    text: string,
    files: WorkspaceFile[],
    options?: RetrievalSearchOptions,
  ): Promise<RetrievalSearchResponse>;
}

export interface ServerManager {
  start(): Promise<void>;
  close(): Promise<void>;
}

export interface AuthenticationToken {
  token: string;
  expiresOnTimestamp: number;
  credential: TokenCredential;
}

/**
 * Determines whether an Azure authentication token has expired.
 *
 * @param token - The authentication token to check. Contains the token string, expiration timestamp, and credential object.
 *                If null or undefined, the token is considered expired.
 * @returns True if the token is expired or invalid; false otherwise.
 *
 * Note: The function considers a token expired if its expiration timestamp is within 5 seconds
 * of the current time, to account for potential timing discrepancies.
 */
export function isAzureTokenExpired(token: AuthenticationToken) {
  // Consider the token expired 5 seconds before the actual expiration to avoid timing issues
  return !token || token.expiresOnTimestamp < Date.now() - 5_000;
}

export interface AzureTokenResolver {
  token(
    credentialsType: AzureCredentialsType,
    options?: CancellationOptions,
  ): Promise<{
    token?: AuthenticationToken;
    error?: SerializedError;
  }>;
}

export type ModelConfiguration = Readonly<
  Pick<ModelOptions, "model" | "temperature" | "reasoningEffort" | "fallbackTools"> & {
    source: "cli" | "env" | "script" | "config" | "default";
    candidates?: string[];
  }
>;

export type ModelConfigurations = {
  large: ModelConfiguration;
  small: ModelConfiguration;
  vision: ModelConfiguration;
  embeddings: ModelConfiguration;
} & Record<string, ModelConfiguration>;

export interface Host {
  userState: Record<string, any>;
  server: ServerManager;
  path: Path;

  createUTF8Decoder(): UTF8Decoder;
  createUTF8Encoder(): UTF8Encoder;
  projectFolder(): string;
  resolvePath(...segments: string[]): string;

  getLanguageModelConfiguration(
    modelId: string,
    options?: { token?: boolean } & CancellationOptions & TraceOptions,
  ): Promise<LanguageModelConfiguration | undefined>;
  log(level: LogLevel, msg: string): void;

  // fs
  statFile(name: string): Promise<{
    size: number;
    type: "file" | "directory" | "symlink";
  }>;
  readFile(name: string): Promise<Uint8Array>;
  writeFile(name: string, content: Uint8Array): Promise<void>;
  deleteFile(name: string): Promise<void>;
  findFiles(
    pattern: string | string[],
    options?: {
      ignore?: string | string[];
      applyGitIgnore?: boolean;
    },
  ): Promise<string[]>;

  // This has mkdirp-semantics (parent directories are created and existing ignored)
  createDirectory(name: string): Promise<void>;
  deleteDirectory(name: string): Promise<void>;
}

export interface RuntimeHost extends Host {
  project: Project;
  workspace: Omit<WorkspaceFileSystem, "grep" | "writeCached">;

  azureToken?: AzureTokenResolver;
  azureAIServerlessToken?: AzureTokenResolver;
  azureManagementToken?: AzureTokenResolver;
  microsoftGraphToken?: AzureTokenResolver;

  modelAliases: Readonly<ModelConfigurations>;
  clientLanguageModel?: LanguageModel;

  mcp: McpClientManager;
  resources: ResourceManager;

  pullModel(
    cfg: LanguageModelConfiguration,
    options?: TraceOptions & CancellationOptions,
  ): Promise<ResponseStatus>;

  clearModelAlias(source: "cli" | "env" | "config" | "script"): void;
  setModelAlias(
    source: "env" | "cli" | "config" | "script",
    id: string,
    value: string | Omit<ModelConfiguration, "source">,
  ): void;

  /**
   * Reloads the configuration
   */
  readConfig(): Promise<HostConfiguration>;

  /**
   * Gets the current loaded configuration
   */
  get config(): HostConfiguration;
  /**
   * Reads a secret
   * @param name
   */
  readSecret(name: string): Promise<string | undefined>;
  // executes a process
  exec(
    containerId: string,
    command: string,
    args: string[],
    options: ShellOptions & TraceOptions & CancellationOptions,
  ): Promise<ShellOutput>;

  /**
   * Starts a container to execute sandboxed code
   * @param options
   */
  container(options: ContainerOptions & TraceOptions): Promise<ContainerHost>;

  /**
   * Instantiates a python evaluation environment
   */
  python(
    options?: PythonRuntimeOptions & TraceOptions & CancellationOptions,
  ): Promise<PythonRuntime>;

  /**
   * Launches a browser page
   * @param url
   * @param options
   */
  browse(url: string, options?: BrowseSessionOptions & TraceOptions): Promise<BrowserPage>;

  /**
   * Cleanup all temporary containers.
   */
  removeContainers(): Promise<void>;

  /**
   * Cleanup all temporary browsers.
   */
  removeBrowsers(): Promise<void>;

  /**
   * Asks the user to select between options
   * @param message question to ask
   * @param options options to select from
   */
  select(
    message: string,
    choices: (string | ShellSelectChoice)[],
    options?: ShellSelectOptions,
  ): Promise<string>;

  /**
   * Asks the user to input a text
   * @param message message to ask
   */
  input(message: string, options?: ShellInputOptions): Promise<string>;

  /**
   * Asks the user to confirm a message
   * @param message message to ask
   */
  confirm(message: string, options?: ShellConfirmOptions): Promise<boolean>;

  /**
   * Instantiates a content safety client
   * @param id
   */
  contentSafety(
    id?: ContentSafetyProvider,
    options?: TraceOptions & CancellationOptions,
  ): Promise<ContentSafety>;
}

export let host: Host;
/**
 * Assigns a Host implementation to the global `host` variable.
 *
 * @param h - The Host instance to set as the global host. This allows integration
 *            with the provided Host functionality for further operations and services.
 */
export function setHost(h: Host) {
  host = h;
}
export let runtimeHost: RuntimeHost;
/**
 * Sets the runtime host instance and updates the global host reference.
 *
 * @param h - An instance of RuntimeHost representing the runtime host to be set.
 *            This will also update the `host` to refer to the same instance.
 */
export function setRuntimeHost(h: RuntimeHost) {
  dbg(`set runtime host`);
  setHost(h);
  runtimeHost = h;
}

export function checkRuntime(): void {
  if (typeof resolveGlobal().env === "undefined") {
    dbg(`attempt to access uninitialized runtime host`);
    throw new Error(
      "Runtime not initialized, https://microsoft.github.io/genaiscript/reference/runtime/.",
    );
  }
}
