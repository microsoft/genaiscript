// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { isGlobMatch } from "./glob.js";
import { DEFAULT_ALLOWED_DOMAINS } from "./constants.js";

/**
 * Checks if a domain is allowed based on configured patterns.
 * Supports wildcard patterns using minimatch.
 * 
 * @param domain - The domain to check (e.g., "github.com", "api.openai.com")
 * @param options - Options object containing allowedDomains
 * @returns true if the domain is allowed, false otherwise
 */
export function isDomainAllowed(domain: string, options?: { allowedDomains?: string[] }): boolean {
  if (!domain) {
    return false;
  }
  
  const allowedDomains = options?.allowedDomains || DEFAULT_ALLOWED_DOMAINS;
  if (!allowedDomains || allowedDomains.length === 0) {
    return false;
  }
  
  return isGlobMatch(domain, allowedDomains);
}

/**
 * Creates a descriptive error message when a domain is not allowed.
 * 
 * @param domain - The blocked domain
 * @param options - Options object containing allowedDomains
 * @returns A clear error message explaining the domain restriction
 */
export function createDomainBlockedError(domain: string, options?: { allowedDomains?: string[] }): string {
  const allowedDomains = options?.allowedDomains || DEFAULT_ALLOWED_DOMAINS;
  return `Domain '${domain}' is not allowed. Allowed domains: ${allowedDomains.join(', ')}. Configure allowed domains via GENAISCRIPT_ALLOWED_DOMAINS environment variable or allowedDomains in config file.`;
}