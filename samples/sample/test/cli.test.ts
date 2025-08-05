import { describe, test, assert, beforeEach } from "vitest";
import { $ } from "zx";
import { join } from "node:path";

const cli = join("..", "..", "packages", "cli", "dist", "src", "index.js");

describe("init", async () => {
  await import("zx/globals");
  test("should import zx", () => {
    assert($);
  });
});
describe("run", async () => {
  const cmd = "run";
  const flags = "";
  await test("poem", async () => {
    const res = await $`node ${cli} ${cmd} poem --model echo`;
    console.log("---\n" + res.stdout + "\n---");
  });
  /*    await test("gist", async () => {
        const uri =
            "vscode://vsls-contrib.gistfs/open?gist=8f7db2674f7b0eaaf563eae28253c2b0&file=echo.genai.mts"
        const res = await $`node ${cli} ${cmd} ${uri} --model echo`
        console.log("---\n" + res.stdout + "\n---")
    })*/
});
describe("scripts", async () => {
  const cmd = "scripts";
  await test("list json", async () => {
    const res = await $`node ${cli} ${cmd} list --json --unlisted`;
    const d = JSON.parse(res.stdout);
    assert(d.find((s) => s.id === "poem"));
    assert(d.find((s) => s.id === "system"));
    assert(d.find((s) => s.id === "system.output_markdown"));
    assert(!d.some((s) => s.system && s.filename));
  });
});
describe("cli", async () => {
  const action = "info";
  test("help", async () => {
    await $`node ${cli} ${action} help`;
  });
  test("system", async () => {
    await $`node ${cli} ${action} system`;
  });
  test("env", async () => {
    await $`node ${cli} ${action} env`;
  });
  test("env openai", async () => {
    await $`node ${cli} ${action} env openai`;
  });
});
describe("cli", async () => {
  const action = "models";
  test("models", async () => {
    await $`node ${cli} ${action}`;
  });
  test("models alias", async () => {
    await $`node ${cli} ${action} alias`;
  });
});
describe("parse", async () => {
  const cmd = "parse";
  await test("pdf", async () => {
    const res = await $`node ${cli} ${cmd} pdf src/rag/loremipsum.pdf`;
    assert(res.stdout.includes("Lorem Ipsum"));
  });
  await test("docx", async () => {
    const res = await $`node ${cli} ${cmd} docx src/rag/Document.docx`;
    assert(res.stdout.includes("**Microsoft Word**"));
  });
  await test("tokens", async () => {
    await $`node ${cli} ${cmd} tokens "src/*" -e "**/*.pdf" -e "**/*.docx"`;
  });
});

describe("retrieval", () => {
  const cmd = "retrieval";
  describe("fuzz", () => {
    const action = "fuzz";
    test("markdown", async () => {
      const res = await $`node ${cli} ${cmd} ${action} markdown src/rag/*`.nothrow();
      assert(res.stdout.includes("markdown.md"));
      assert(!res.exitCode);
    });
  });
});

describe("video", () => {
  const cmd = "video";
  test("extract-audio", async () => {
    const action = "extract-audio";
    const res = await $`node ${cli} ${cmd} ${action} src/audio/helloworld.mp4`.nothrow();
    assert(!res.exitCode);
  }, 10000);

  test("extract-frames", async () => {
    const action = "extract-frames";
    const res = await $`node ${cli} ${cmd} ${action} src/audio/helloworld.mp4`.nothrow();
    assert(!res.exitCode);
  }, 10000);

  test("probe", async () => {
    const action = "probe";
    const res = await $`node ${cli} ${cmd} ${action} src/audio/helloworld.mp4`.nothrow();
    assert(!res.exitCode);
  }, 10000);
});

describe("action", () => {
  const cmd = "configure";
  test("configure", async () => {
    const action = "action";
    const res =
      await $`node ${cli} ${cmd} ${action} --out .genaiscript/action --ffmpeg --playwright`;
    assert(res.stderr.includes("action"));
  });
});

describe("mcp", () => {
  test("mcp config files exist", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    // Test that GitHub Copilot MCP config exists
    const mcpConfigPath = path.join(".vscode", "mcp.json");
    assert(fs.existsSync(mcpConfigPath), "Expected .vscode/mcp.json to exist");
    
    // Test that it's valid JSON
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
    assert(mcpConfig.servers, "Expected servers section in mcp.json");
    assert(typeof mcpConfig.servers === "object", "Expected servers to be an object");
    
    // Test specific servers are configured
    assert(mcpConfig.servers.genaiscript, "Expected genaiscript server to be configured");
    assert(mcpConfig.servers["genaiscript-http"], "Expected genaiscript-http server to be configured");
  });

  test("mcp config format validation", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    const mcpConfigPath = path.join(".vscode", "mcp.json");
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
    
    // Validate genaiscript server configuration
    const genaiscriptServer = mcpConfig.servers.genaiscript;
    assert(genaiscriptServer.type === "stdio", "Expected genaiscript server to use stdio transport");
    assert(genaiscriptServer.command, "Expected genaiscript server to have a command");
    assert(Array.isArray(genaiscriptServer.args), "Expected genaiscript server to have args array");
    
    // Validate genaiscript-http server configuration
    const httpServer = mcpConfig.servers["genaiscript-http"];
    assert(httpServer.type === "http", "Expected genaiscript-http server to use http transport");
    assert(httpServer.url, "Expected genaiscript-http server to have a URL");
  });

  test("genaiscript config exists", async () => {
    const fs = await import("fs");
    
    // Test that GenAIScript config exists
    assert(fs.existsSync("genaiscript.config.json"), "Expected genaiscript.config.json to exist");
    
    // Test that it's valid JSON
    const config = JSON.parse(fs.readFileSync("genaiscript.config.json", "utf-8"));
    assert(config.$schema, "Expected config to have a schema");
  });

  test("mcp integration test", async () => {
    // This test verifies that the MCP configuration is properly structured
    // for integration between GitHub Copilot and GenAIScript
    const fs = await import("fs");
    const path = await import("path");
    
    const mcpConfigPath = path.join(".vscode", "mcp.json");
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
    const genaiscriptConfig = JSON.parse(fs.readFileSync("genaiscript.config.json", "utf-8"));
    
    // Verify that MCP servers point to the correct GenAIScript locations
    const genaiscriptServer = mcpConfig.servers.genaiscript;
    assert(genaiscriptServer.args.includes("mcp"), "Expected genaiscript server to include 'mcp' argument");
    
    // Verify the HTTP server points to the expected port
    const httpServer = mcpConfig.servers["genaiscript-http"];
    assert(httpServer.url.includes("8003"), "Expected HTTP server to use port 8003");
    
    console.log("✅ MCP configuration validated successfully");
    console.log(`📁 Found ${Object.keys(mcpConfig.servers).length} MCP servers configured`);
    console.log(`🔧 GenAIScript config schema: ${genaiscriptConfig.$schema.split('/').pop()}`);
  });
});
