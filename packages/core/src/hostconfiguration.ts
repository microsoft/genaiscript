// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ModelConfiguration } from "./host.js";

/**
 * Schema for a global configuration file
 */
export interface HostConfiguration {
  /**
   * Path to the .env file
   */
  envFile?: string | string[];

  /**
   * List of glob paths to scan for genai scripts
   */
  include?: (
    | string
    | {
        pattern: string;
        ignoreGitIgnore?: boolean;
      }
  )[];

  /**
   * Ignore scripts in the current workspace.
   */
  ignoreCurrentWorkspace?: boolean;

  /**
   * Configures a list of known aliases. Overridden by environment variables and CLI arguments
   */
  modelAliases?: Record<string, string | ModelConfiguration>;

  /**
   * Model identifier to encoding mapping
   */
  modelEncodings?: Record<string, string>;

  /**
   * A map of secret name and their respective regex pattern
   */
  secretPatterns?: Record<string, string>;
}
