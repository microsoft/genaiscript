script({ model: "echo" })
const res = await transcribe("src/audio/helloworld.mp3")
console.log(res)

const res2 = await transcribe("src/audio/helloworld.mp3", {
    translate: true,
    temperature: 1.5,
    cache: true,
})
for (const segment of res2.segments) {
    const { start, text } = segment
    console.log(`[${start}] ${text}`)
}
console.log(res2)

const resv = await transcribe("src/audio/helloworld.mp4")
console.log(resv)

const resv2 = await transcribe("src/audio/helloworld.mp4")
console.log(resv2)
