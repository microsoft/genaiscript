// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { isGlobMatch } from "./glob.js";
import type { HostConfiguration } from "./hostconfiguration.js";

/**
 * Default allowed domains for HTTPS resource resolution.
 */
const DEFAULT_ALLOWED_DOMAINS = ["github.com", "*.github.com", "*.githubusercontent.com", "*.github.io"];

/**
 * Checks if a domain is allowed based on configured patterns.
 * Supports wildcard patterns using minimatch.
 * 
 * @param domain - The domain to check (e.g., "github.com", "api.openai.com")
 * @param config - Configuration object containing allowedDomains
 * @returns true if the domain is allowed, false otherwise
 */
export function isDomainAllowed(domain: string, config?: HostConfiguration): boolean {
  if (!domain) {
    return false;
  }
  
  const allowedDomains = config?.allowedDomains || DEFAULT_ALLOWED_DOMAINS;
  if (!allowedDomains || allowedDomains.length === 0) {
    return false;
  }
  
  return isGlobMatch(domain, allowedDomains);
}

/**
 * Creates a descriptive error message when a domain is not allowed.
 * 
 * @param domain - The blocked domain
 * @param config - Configuration object containing allowedDomains
 * @returns A clear error message explaining the domain restriction
 */
export function createDomainBlockedError(domain: string, config?: HostConfiguration): string {
  const allowedDomains = config?.allowedDomains || DEFAULT_ALLOWED_DOMAINS;
  return `Domain '${domain}' is not allowed. Allowed domains: ${allowedDomains.join(', ')}. Configure allowed domains via GENAISCRIPT_ALLOWED_DOMAINS environment variable or allowedDomains in config file.`;
}