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
