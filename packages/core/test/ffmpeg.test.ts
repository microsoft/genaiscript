// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";

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
});