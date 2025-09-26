import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

Avez-vous déjà souhaité une manière simple de créer un résumé et une narration audio pour votre article de blog ?
Ce script vous aide à faire cela grâce à l'IA, transformant le contenu de votre blog en un résumé textuel et un fichier audio vocal.\
[Voir la source sur GitHub.](https://github.com/microsoft/genaiscript/blob/main/docs/genaisrc/blog-narration.genai.mts)

## Comment fonctionne le script

Passons en revue le script étape par étape en expliquant ce que fait chaque partie.

```ts
script({
  title: "Blog Post Narrator",
  description: "Creates narrated summaries of blog posts",
  accept: ".mdx,.md",
  model: "large",
  system: ["system.annotations"],
  files: "docs/src/content/docs/blog/azure-ai-search.mdx",
  parameters: {
    force: false,
  },
});
```

* définit les métadonnées du script : titre, description, quels types de fichiers il traite (`.mdx`, `.md`), et quel modèle d'IA utiliser.
* `"files"` pointe vers l'article de blog d'exemple à narrer.
* `"parameters"` définit les options facultatives du script.

```ts
const { force } = env.vars;
const file = env.files[0];
if (!file) cancel("No file provided");
```

* lit les paramètres d'entrée à partir des variables d'environnement et des fichiers.
* Si aucun fichier n'est fourni, le script s'annule immédiatement.

```ts
const targetName = path.basename(
  path.changeext(file.filename, ".mp3"),
);
const target = path.join(`./docs/public/blog`, targetName);
if (!force && (await workspace.stat(target))) {
  cancel(`File already exists: ${target}`);
}
```

* prépare le nom et l'emplacement cible pour le fichier audio `.mp3` de sortie.
* Si le fichier existe déjà et que `force` n'est pas défini, le script s'annule.

```ts
const examples = {
    dramatic: `Voice Affect: Low, hushed, and suspenseful; convey tension and intrigue....`,
    friendly: `Affect/personality: A cheerful guide...`, ...
}
```

* prépare divers styles d'échantillons de voix et de narration pour guider le modèle.

```ts
const {
    json: { summary, instructions, voice },
} = await runPrompt(
    (_) => {
        _.def("CONTENT", file)
        _.`You are a podcast writer.

Your task is to create an engaging summary of this blog post that would work well as a narration
AND a voice description for a text-to-speech model AND a voice type.

## Summary Instructions
    - Focus on the key points and main message
    - Use natural, conversational language
    - Keep it between 2-3 paragraphs
    - You can use Technical Jargon, but explain it in simple terms
    - Do not start with Excited

## Voice Instructions
    - In your thinking, generate 5 descriptions of the voice suitable for a text-to-speech model. These voice personalities should be wildly different and esoteric.
    - Include details about the accent, tone, pacing, emotion, pronunciation, and personality affect
    - Get inspired by the content of the blog post
    - Pick one of the 5 voices randomly as your output.
    - go crazy on the voice descriptions

    Follow the structure of the following examples:
    ${YAML.stringify(examples)}

    ## Voice Type
    Select one of the voice types provided by OpenAI ("alloy" | "ash" | "coral" | "echo" | "fable" | "onyx" | "nova" | "sage" | "shimmer" | "verse" | "ballad") based on the blog post content
    and the voice description you generated.
    `
    },
    {
        temperature: 1.1,
        responseType: "json_schema",
        responseSchema: {
            instructions: "voice description",
            voice: {
                required: true,
                type: "string",
                enum: [
                    "alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "ballad",
                ],
            },
            summary: "summary",
        },
    }
)
```

* Exécute un prompt alimenté par l'IA pour générer :
  * Un résumé de l'article de blog
  * Une description du style de narration
  * Un type de voix (parmi les voix TTS d'OpenAI)
* Le prompt détaille toutes les exigences pour le modèle d'IA, y compris les instructions et des exemples de résultats.

```ts
const { filename } = await speak(summary, {
  model: "openai:gpt-4o-mini-tts", // High quality speech model
  voice, // Use a natural-sounding voice
  instructions,
});
```

* Appelle la fonction `speak` pour générer une narration audio du résumé en utilisant le type de voix et le style de narration choisi.

```ts
if (!filename) cancel("failed to generate speech");
console.log(`audio file: ${filename}`);
```

* Si la génération du fichier audio échoue, le script s'arrête.
* Sinon, il enregistre le nom du fichier audio généré.

## Fonctions importées

Ce script utilise des utilitaires de `genaiscript/runtime` :

* `runPrompt` - envoie des prompts au modèle d'IA et retourne des résultats structurés.
* `speak` - génère une narration audio à partir de texte et d'instructions vocales.
* `workspace` - gère les opérations sur les fichiers en toute sécurité.
* `host.exec` - exécute des commandes shell (comme `ffmpeg`) pour traiter des fichiers.

Vous pouvez [consulter la source runtime ici](https://github.com/microsoft/genaiscript/blob/main/packages/cli/src/runtime.ts).

## Résumé

Ce script transforme rapidement n'importe quel article de blog en un résumé textuel et une narration vocale, prêt à être partagé en tant qu'audio ou vidéo. Parfait pour rendre votre blog plus accessible et engageant ! 🎤📝