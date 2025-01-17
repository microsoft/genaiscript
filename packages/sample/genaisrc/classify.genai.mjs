import { classify } from "genaiscript/runtime"

const qa = await classify(
    "The app crashes when I try to upload a file.",
    {
        bug: "a software defect",
        feat: "a feature request",
        qa: "an inquiry about how to use the software",
    },
    { other: true }
)

console.log(qa)

const joke = await classify(
    "Why did the chicken cross the roard? To fry in the sun.",
    {
        yes: "funny",
        no: "not funny",
    },
    { explanations: true }
)

console.log(joke)

const robots = await classify(
    (_) => _.defImages("src/robots.jpg"),
    {
        object: "Depicts objects, machines, robots, toys, ...",
        animal: "Animals, pets, monsters",
    },
    { other: true }
)
console.log(robots)
