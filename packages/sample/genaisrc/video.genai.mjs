import { delay } from "genaiscript/runtime"

const frames = await parsers.videoFrames(
    "packages/sample/src/audio/helloworld.mp4"
)
defImages(frames)
$`Describe the images.`
