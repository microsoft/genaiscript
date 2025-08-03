import { describe, it, expect } from "vitest";
import { validateJSONWithSchema } from "../src/schema.js";
import configSchema from "../src/configschema.js";

describe("MCP Configuration Schema Validation", () => {
  it("should validate valid mcpServers configuration", () => {
    const config = {
      mcpServers: {
        "test-server": {
          type: "stdio",
          command: "node",
          args: ["server.js"],
          env: {
            "NODE_ENV": "test"
          }
        },
        "http-server": {
          type: "http",
          url: "http://localhost:8080/mcp"
        }
      }
    };

    const validation = validateJSONWithSchema(config, configSchema);
    expect(validation.schemaError).toBeUndefined();
  });

  it("should validate mixed configuration with mcpServers and other fields", () => {
    const config = {
      envFile: ".env",
      include: ["*.genai.mts"],
      modelAliases: {
        "gpt4": "openai:gpt-4"
      },
      mcpServers: {
        "genaiscript": {
          command: "npx",
          args: ["genaiscript", "mcp"]
        }
      }
    };

    const validation = validateJSONWithSchema(config, configSchema);
    expect(validation.schemaError).toBeUndefined();
  });

  it("should reject invalid mcpServers configuration", () => {
    const config = {
      mcpServers: {
        "invalid-server": {
          type: "invalid-type", // Should only be stdio, http, or sse
          command: "test"
        }
      }
    };

    const validation = validateJSONWithSchema(config, configSchema);
    expect(validation.schemaError).toBeDefined();
  });

  it("should reject mcpServers with invalid environment variable names", () => {
    const config = {
      mcpServers: {
        "test-server": {
          command: "node",
          args: ["server.js"],
          env: {
            "123INVALID": "value", // Environment variable names can't start with numbers
          }
        }
      }
    };

    const validation = validateJSONWithSchema(config, configSchema);
    expect(validation.schemaError).toBeDefined();
  });
});