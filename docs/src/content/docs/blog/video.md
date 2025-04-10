---
title: Let there be videos!
date: 2025-01-15
authors:
  - pelikhan
tags:
  - video
  - ffmpeg
canonical_url: https://microsoft.github.io/genaiscript/blog/video
description: Add videos to your LLMs calls.
cover:
  alt: A colorful, simplified illustration shows a futuristic desk setup. There's
    a large computer screen with visual representations of video and audio, like
    frames and waveforms. Surrounding the screen are stylized geometric symbols
    for video and audio tools. The design uses abstract shapes in the background
    to convey an atmosphere of creativity and innovation, drawing inspiration
    from 8-bit style. It employs just five bold colors to keep the look clear
    and corporate, with no people or language visible.
  image: ./video.png
excerpt: Analyze videos with ease. Traditional LLMs require timestamp-based
  screenshots, often leading to context window issues. GenAIScript simplifies
  video and audio analysis by enabling automated frame extraction and transcript
  integration. Learn how tools and agents streamline these tasks for your
  scripts in the documentation.

---

The latest release includes support for including videos and audio transcripts in your scripts.

```js wrap
const frames = await ffmpeg.extractFrames("demo.mp4", { transcription: true })
def("DEMO", frames)

$`Describe what happens in the <DEMO>.`
```

Say you want to analyze a video file. For most LLMs that support images, you would have to extract screenshots at particular timestamps then send them as a sequence of images.
Choosing those timestamp could be a challenge since you will run out of context window. GenAIScript provides a helpers to solve this tedious tasks around video analysis using LLMs.

- visit the [documentation](/genaiscript/reference/scripts/videos).

## tools and agents

We also provides wrap the new functionalities in [tools](/genaiscript/reference/scripts/tools) and [agents](/genaiscript/reference/scripts/agents) so you can use them in your scripts.

For example, to include the frame extraction tool so that the LLM is able to call it, you can use the following snippet:

```js wrap
script({
    tools: "video_extract_frames",
})
```

Or just let the agent work on the video for you.

```js wrap
script({
    tools: "agent_video",
})
```
