// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { resolve } from "node:path";

describe("FFmpeg Command Builder", () => {
  test("should create basic FFmpeg command", async () => {
    const { ffmpegCommand } = await import("../src/ffmpeg.js");
    const cmd = await ffmpegCommand();
    
    assert(cmd);
    assert(typeof cmd.input === "function");
    assert(typeof cmd.output === "function");
    assert(typeof cmd.noVideo === "function");
    assert(typeof cmd.noAudio === "function");
    assert(typeof cmd.audioCodec === "function");
    assert(typeof cmd.videoBitrate === "function");
    assert(typeof cmd.size === "function");
    assert(typeof cmd.run === "function");
  });

  test("should build video filter chain correctly", async () => {
    const { ffmpegCommand } = await import("../src/ffmpeg.js");
    const cmd = await ffmpegCommand();
    
    cmd.videoFilters("select='eq(pict_type,I)'");
    cmd.size("640x480");
    cmd.autopad();
    
    // Access the private args for testing
    const args = (cmd as any).args;
    assert(args.includes("-vf"));
    assert(args.includes("-s"));
    assert(args.includes("640x480"));
  });

  test("should build audio conversion command correctly", async () => {
    const { ffmpegCommand } = await import("../src/ffmpeg.js");
    const cmd = await ffmpegCommand();
    
    cmd.noVideo();
    cmd.audioCodec("libopus");
    cmd.audioChannels(1);
    cmd.audioBitrate("12k");
    cmd.toFormat("ogg");
    
    const args = (cmd as any).args;
    assert(args.includes("-vn"));
    assert(args.includes("-acodec"));
    assert(args.includes("libopus"));
    assert(args.includes("-ac"));
    assert(args.includes("1"));
    assert(args.includes("-ab"));
    assert(args.includes("12k"));
    assert(args.includes("-f"));
    assert(args.includes("ogg"));
  });

  test("should handle ffprobe command correctly", async () => {
    const { ffmpegCommand } = await import("../src/ffmpeg.js");
    const cmd = await ffmpegCommand();
    
    cmd.input("test.mp4");
    
    // Test that ffprobe method exists and can be called
    assert(typeof cmd.ffprobe === "function");
    
    // Access the private inputFile for testing
    const inputFile = (cmd as any).inputFile;
    assert.equal(inputFile, "test.mp4");
  });

  test("should create FFmpeg client", async () => {
    const { FFmepgClient } = await import("../src/ffmpeg.js");
    const client = new FFmepgClient();
    
    assert(client);
    assert(typeof client.extractFrames === "function");
    assert(typeof client.extractAudio === "function");
    assert(typeof client.extractClip === "function");
    assert(typeof client.probe === "function");
    assert(typeof client.probeVideo === "function");
  });

  test("should execute ffprobe on MP4 file", async () => {
    const { FFmepgClient } = await import("../src/ffmpeg.js");
    const client = new FFmepgClient();
    
    // Path to the MP4 file in samples/sample folder
    const mp4Path = resolve(__dirname, "../../../samples/sample/src/audio/helloworld.mp4");
    
    try {
      // Test probe method (async)
      const probeResult = await client.probe(mp4Path);
      
      // Validate basic structure
      assert(probeResult, "Probe result should not be null");
      assert(Array.isArray(probeResult.streams), "Should have streams array");
      assert(probeResult.format, "Should have format object");
      assert(probeResult.streams.length > 0, "Should have at least one stream");
      
      // Check if we have video stream data
      const videoStream = probeResult.streams.find(s => s.codec_type === "video");
      if (videoStream) {
        // Test probeVideo method if video stream exists
        const videoInfo = await client.probeVideo(mp4Path);
        assert(videoInfo, "Video info should not be null");
        assert(videoInfo.codec_type === "video", "Should be video stream");
        assert(typeof videoInfo.width === "number", "Should have width");
        assert(typeof videoInfo.height === "number", "Should have height");
      }
      
      console.log(`Successfully probed MP4 file: ${probeResult.streams.length} streams found`);
      
    } catch (error) {
      // If ffprobe is not available, skip the test with a clear message
      if (error.message.includes("ffprobe command not found")) {
        console.log("Skipping ffprobe test: FFmpeg not installed on system");
        return; // Skip test gracefully
      }
      
      // If file doesn't exist, provide helpful error
      if (error.message.includes("ENOENT") || error.message.includes("No such file")) {
        throw new Error(`MP4 test file not found at: ${mp4Path}`);
      }
      
      // Re-throw other unexpected errors
      throw error;
    }
  });
});