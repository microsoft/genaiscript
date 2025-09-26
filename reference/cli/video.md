Some of the [video processing capabilities](/genaiscript/reference/scripts/videos) are also available in the cli.

### `video probe`

Returns the result of `ffprobe` in the console.

```sh
genaiscript video probe myvid.mp4
```

### `video extract-audio`

Extracts the audio to a smaller format, optimized for transcription.

```sh
genaiscript video extract-audio myvid.mp4
```

### `video extract-frames`

Extracts screenshots from the video. You can specify timestamps in seconds or `h:mm:ss`, or a count of videos.

```sh
genaiscript video extract-video myvid.mp4
```