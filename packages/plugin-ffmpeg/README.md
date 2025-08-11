# @genaiscript/plugin-ffmpeg

FFmpeg plugin for GenAIScript providing video and audio processing capabilities.

## Features

- Extract frames from videos
- Extract audio from videos  
- Extract clips from videos
- Probe video metadata
- Custom ffmpeg operations

## Installation

```bash
npm install @genaiscript/plugin-ffmpeg
```

## Usage

The plugin exports the `FFmepgClient` class that provides video processing functionality:

```typescript
import { FFmepgClient } from "@genaiscript/plugin-ffmpeg";

const ffmpeg = new FFmepgClient();

// Extract frames from a video
const frames = await ffmpeg.extractFrames("video.mp4");

// Extract audio from a video
const audio = await ffmpeg.extractAudio("video.mp4");

// Get video metadata
const info = await ffmpeg.probe("video.mp4");
```

## Requirements

This plugin requires [ffmpeg](https://ffmpeg.org/) to be installed on your system.

## License

MIT