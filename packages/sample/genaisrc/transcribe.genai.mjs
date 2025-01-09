const res = await transcribe("src/audio/helloworld.mp3")
console.log(res)

const res2 = await transcribe("src/audio/helloworld.mp3", {
    translate: true,
    temperature: 1.5,
    cache: true
})
console.log(res2)
