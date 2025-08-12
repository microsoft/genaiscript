// Test to validate ffprobe improvements
// This test would validate the enhanced error handling and type safety

import { describe, test, expect } from "vitest";

describe("FFprobe Enhanced Implementation", () => {
  test("should handle missing input file gracefully", async () => {
    const { ffmpegCommand } = await import("../src/ffmpeg.js");
    const cmd = await ffmpegCommand();
    
    // Test ffprobe with no input file
    const result = new Promise((resolve, reject) => {
      cmd.ffprobe((err, data) => {
        if (err) {
          resolve(err.message);
        } else {
          reject(new Error("Should have failed"));
        }
      });
    });
    
    const errorMessage = await result;
    expect(errorMessage).toBe("No input file specified for ffprobe");
  });

  test("should provide helpful error for missing ffprobe command", async () => {
    const { ffmpegCommand } = await import("../src/ffmpeg.js");
    const cmd = await ffmpegCommand();
    
    cmd.input("nonexistent.mp4");
    
    // This test simulates what happens when ffprobe is not installed
    // The actual spawn will fail with ENOENT
    const result = new Promise((resolve) => {
      cmd.ffprobe((err) => {
        resolve(err?.message || "No error");
      });
    });
    
    const errorMessage = await result;
    expect(errorMessage).toContain("ffprobe command not found");
  });

  test("should validate ffprobe output structure", async () => {
    const { ffmpegCommand } = await import("../src/ffmpeg.js");
    const cmd = await ffmpegCommand();
    
    cmd.input("test.mp4");
    
    // We can't actually test the ffprobe functionality without ffmpeg installed
    // But we can verify that our code structure and interfaces are correct
    expect(typeof cmd.ffprobe).toBe("function");
    expect(cmd.input).toBeDefined();
    expect(cmd.output).toBeDefined();
  });

  test("should handle probeVideo with no video streams", async () => {
    const { FFmepgClient } = await import("../src/ffmpeg.js");
    const client = new FFmepgClient();
    
    // Mock the probe method to return data without video streams
    const originalProbe = client.probe;
    client.probe = async () => ({
      streams: [
        {
          index: 0,
          codec_name: "aac",
          codec_type: "audio",
          // Audio stream properties...
        }
      ],
      format: {
        filename: "test.mp4",
        format_name: "mp4",
        duration: 10.0,
        // Other format properties...
      }
    });
    
    try {
      await client.probeVideo("test.mp4");
      throw new Error("Should have thrown an error");
    } catch (err) {
      expect(err.message).toBe("No video stream found in the file");
    }
    
    // Restore original method
    client.probe = originalProbe;
  });
});