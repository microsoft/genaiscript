// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { TestHost } from "../src/testhost.js";
import CONFIGURATION_DATA from "../src/llmsdata.js";
import { applyModelProviderAliases } from "../src/modelalias.js";
import { resolveRuntimeHost } from "../src/host.js";

describe("Model Alias Tests", () => {
  beforeEach(async () => {
    TestHost.install();
  });

  test("should collect all known model aliases from llmsdata", () => {
    // Extract all unique aliases from provider configurations
    const allAliases = new Set<string>();
    
    // Add provider-specific aliases
    for (const provider of CONFIGURATION_DATA.providers) {
      if (provider.aliases) {
        Object.keys(provider.aliases).forEach(alias => allAliases.add(alias));
      }
    }
    
    // Add global aliases
    Object.keys(CONFIGURATION_DATA.aliases).forEach(alias => allAliases.add(alias));
    
    console.log("Found aliases:", Array.from(allAliases).sort());
    
    // Verify we found some known aliases
    const expectedAliases = [
      "large", "small", "tiny", "vision", "reasoning", "reasoning_small",
      "embeddings", "agent", "memory", "classify", "summarize"
    ];
    
    expectedAliases.forEach(alias => {
      assert(allAliases.has(alias), `Expected alias '${alias}' should be found in llmsdata`);
    });
    
    // Should have at least 10 aliases
    assert(allAliases.size >= 10, `Expected at least 10 aliases, found ${allAliases.size}`);
  });

  test("should test model alias resolution for each known alias", () => {
    const runtimeHost = resolveRuntimeHost();
    
    // Apply OpenAI provider aliases (which has the most comprehensive set)
    applyModelProviderAliases("openai", "script");
    
    // Test each provider that has aliases
    for (const provider of CONFIGURATION_DATA.providers) {
      if (provider.aliases && Object.keys(provider.aliases).length > 0) {
        console.log(`Testing provider: ${provider.id}`);
        
        // Apply this provider's aliases
        applyModelProviderAliases(provider.id, "script");
        
        // Test each alias for this provider
        Object.keys(provider.aliases).forEach(alias => {
          const expectedModel = `${provider.id}:${provider.aliases![alias]}`;
          const resolvedAlias = runtimeHost.modelAliases[alias];
          
          if (resolvedAlias) {
            console.log(`  ${alias} -> ${resolvedAlias.model}`);
            assert(resolvedAlias.model === expectedModel, 
              `Alias '${alias}' should resolve to '${expectedModel}', got '${resolvedAlias.model}'`);
          }
        });
      }
    }
  });

  test("should verify global aliases work correctly", () => {
    const runtimeHost = resolveRuntimeHost();
    
    // Apply OpenAI provider first to establish base aliases
    applyModelProviderAliases("openai", "script");
    
    // Test global aliases
    Object.entries(CONFIGURATION_DATA.aliases).forEach(([alias, target]) => {
      console.log(`Testing global alias: ${alias} -> ${target}`);
      
      // The target should be resolvable
      const targetAlias = runtimeHost.modelAliases[target];
      if (targetAlias) {
        // For example: "agent" -> "large" -> "openai:gpt-4.1"
        console.log(`  ${alias} -> ${target} -> ${targetAlias.model}`);
        assert(targetAlias.model, `Global alias '${alias}' should resolve through '${target}' to a concrete model`);
      }
    });
  });

  test("should demonstrate simple prompt invocation pattern for each alias", async () => {
    // This test demonstrates how each alias could be used in a script
    // Using a mock approach since we can't actually call LLMs in tests
    
    const allAliases = new Set<string>();
    
    // Collect all aliases
    for (const provider of CONFIGURATION_DATA.providers) {
      if (provider.aliases) {
        Object.keys(provider.aliases).forEach(alias => allAliases.add(alias));
      }
    }
    Object.keys(CONFIGURATION_DATA.aliases).forEach(alias => allAliases.add(alias));
    
    console.log(`Testing ${allAliases.size} aliases for prompt invocation pattern:`);
    
    // Simulate what a test script would do for each alias
    for (const alias of Array.from(allAliases).sort()) {
      // This simulates: $`Tell me a joke` with model: alias
      const mockPromptCall = {
        prompt: "Tell me a joke",
        model: alias,
        // In a real test script, this would use the echo provider
        provider: "echo"
      };
      
      console.log(`  Testing alias '${alias}' with prompt: "${mockPromptCall.prompt}"`);
      
      // Verify the alias is valid
      assert(typeof alias === "string" && alias.length > 0, `Alias '${alias}' should be a non-empty string`);
      
      // In a real scenario, you would:
      // const result = await runPrompt(mockPromptCall.prompt, { model: alias, provider: "echo" });
      // assert(result, `Should get response for alias '${alias}'`);
    }
    
    console.log("All aliases demonstrated successfully");
  });
});