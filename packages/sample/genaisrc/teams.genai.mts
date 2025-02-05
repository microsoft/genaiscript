const teams = await host.teamsChannel(
    "https://teams.microsoft.com/l/channel/19%3Ac9392f56d1e940b5bed9abe766832aeb%40thread.tacv2/Test?groupId=5d76383e-5d3a-4b63-b36a-62f01cff2806"
)
await teams.postMessage(
    `# Hello world
This **message** _was_ sent from __genaiscript__.

## YES!
`,
    {
        files: [
            "src/rag/markdown.md",
            {
                filename: "src/audio/helloworld.mp4",
                description: `# This is the title!
                
**Awesome** _video_!

- __really epic__!

## See also

Other videos.
`,
            },
        ],
    }
)
