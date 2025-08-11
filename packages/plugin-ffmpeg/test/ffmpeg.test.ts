import { describe, test, expect } from "vitest";
import { FFmepgClient } from "../src/index.js";

describe("FFmpeg Plugin", () => {
  test("should export FFmepgClient", () => {
    expect(FFmepgClient).toBeDefined();
    expect(typeof FFmepgClient).toBe("function");
  });

  test("should create FFmepgClient instance", () => {
    const client = new FFmepgClient();
    expect(client).toBeDefined();
    expect(typeof client.probe).toBe("function");
    expect(typeof client.extractFrames).toBe("function");
    expect(typeof client.extractAudio).toBe("function");
    expect(typeof client.extractClip).toBe("function");
  });
});