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

```js
const frames = await ffmpeg.extractFrames("demo.mp4", { transcription: true })
def("DEMO", frames)

$`Describe what happens in the <DEMO>.`
```

Say you want to analyze a video file. For most LLMs that support images, you would have to extract screenshots at particular timestamps then send them as a sequence of images.
Choosing those timestamp could be a challenge since you will run out of context window. GenAIScript provides a helpers to solve this tedious tasks around video analysis using LLMs.

Under the hood, GenAIScript uses [ffmpeg](https://ffmpeg.org/) to slice and dice video streams into images or audio files that can be processed by LLMs.

- visit the [documentation](/genaiscript/reference/scripts/videos).
