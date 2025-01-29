import { cast } from "genaiscript/runtime"
script({
    files: [
        "genaisrc/cast.genai.mjs",
        "genaisrc/chunk.genai.mjs",
        "src/robots.jpg",
    ],
})
const { data: res } = await cast("California", {
    type: "object",
    properties: {
        name: { type: "string", description: "The state's abbreviation" },
    },
})
console.log(res)

const { data: ress } = await cast(
    "The quick brown fox jumps over the lazy dog.; jumps",
    {
        type: "object",
        properties: {
            partOfSpeech: { type: "string" },
        },
    },
    {
        instructions: `You will be presented with a sentence and a word contained
in that sentence. You have to determine the part of speech for a given word
and return just the tag for the word's part of speech.
Here is the
Alphabetical list of part-of-speech tags used in this task: CC: Coordinating conjunction, CD: Cardinal number, DT:
Determiner, EX: Existential there, FW: Foreign word, IN: Preposition or subordinating conjunction, JJ: Adjective, JJR:
Adjective, comparative, JJS: Adjective, superlative, LS: List item marker, MD: Modal, NN: Noun, singular or mass, NNS: Noun,
plural, NNP: Proper noun, singular, NNPS: Proper noun, plural, PDT: Predeterminer, POS: Possessive ending, PRP: Personal
pronoun, PRP$: Possessive pronoun, RB: Adverb, RBR: Adverb, comparative, RBS: Adverb, superlative, RP: Particle, SYM: Symbol,
TO: to, UH: Interjection, VB: Verb, base form, VBD: Verb, past tense, VBG: Verb, gerund or present participle, VBN: Verb,
past participle, VBP: Verb, non-3rd person singular present, VBZ: Verb, 3rd person singular present, WDT: Wh-determiner, WP:
Wh-pronoun, WP$: Possessive wh-pronoun, WRB: Wh-adverb`,
    }
)
console.log(ress)

const { data: res2 } = await cast(
    env.files.filter(({ filename }) => !filename.endsWith(".jpg")),
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The name of the file",
            },
            topic: {
                type: "string",
                description: "The topic of the file",
            },
            keywords: {
                type: "array",
                items: {
                    type: "string",
                },
                description: "Keywords for the file",
            },
        },
        required: ["filename", "topic", "keywords"],
    },
    { multiple: true }
)
console.log(res2)

const images = env.files.filter(({ filename }) => filename.endsWith(".jpg"))
await cast((_) => _.defImages(images), {
    type: "object",
    properties: {
        keywords: {
            type: "array",
            items: {
                type: "string",
                description: "Keywords describing the objects on the image",
            },
        },
    },
    required: ["keywords"],
})
