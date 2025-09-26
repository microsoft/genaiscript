Bien que la plupart des LLM ne prennent pas en charge les vidéos nativement, elles peuvent être intégrées dans des scripts en rendant des images et en les ajoutant comme images au prompt. Cela peut être fastidieux et GenAIScript fournit des assistants efficaces pour simplifier ce processus.

## Configuration de ffmpeg

Les fonctionnalités de rendu et d'analyse des vidéos reposent sur [ffmpeg](https://ffmpeg.org/) et [ffprobe](https://ffmpeg.org/ffprobe.html).

Sous Linux, vous pouvez essayer

```sh
sudo apt-get update && sudo apt-get install ffmpeg
```

Assurez-vous que ces outils sont installés localement et disponibles dans votre PATH, ou configurez les variables d'environnement `FFMPEG_PATH` / `FFPROBE_PATH` pour pointer vers l'exécutable `ffmpeg`/`ffprobe`.

## Extraction des images

Comme indiqué ci-dessus, les LLM multimodaux prennent généralement en charge les images sous forme d’une séquence d'images (ou captures d'écran).

La fonction `ffmpeg.extractFrames` va rendre des images à partir d’un fichier vidéo et les retourner sous forme de tableau de chemins de fichiers. Vous pouvez utiliser le résultat directement avec `defImages`.

* par défaut, extraire les images clés (intra-images)

```js
const frames = await ffmpeg.extractFrames("path_to_video")
defImages(frames)
```

* spécifiez un nombre d’images à l’aide de `count`

```js "count: 10"
const frames = await ffmpeg.extractFrames("...", { count: 10 })
```

* spécifiez des horodatages en secondes ou en pourcentages de la durée de la vidéo avec `timestamps` (ou `times`)

```js "timestamps"
const frames = await ffmpeg.extractFrames("...", {
    timestamps: ["00:00", "05:00"],
})
```

* spécifiez la transcription calculée par la fonction [transcribe](../../../reference/reference/scripts/transcription/). GenAIScript extraira une image au début de chaque segment.

```js "timestamps"
const transcript = await transcribe("...")
const frames = await ffmpeg.extractFrames("...", { transcript })
```

* spécifiez un seuil de scène (entre 0 et 1)

```js "sceneThreshold"
const transcript = await transcribe("...", { sceneThreshold: 0.3 })
```

## Extraction de l’audio

La fonction `ffmpeg.extractAudio` extraira l’audio d’un fichier vidéo au format `.wav`.

```js
const audio = await ffmpeg.extractAudio("path_to_video")
```

La conversion vers l’audio se fait automatiquement pour les vidéos lors de l’utilisation de [transcribe](../../../reference/reference/scripts/transcription/).

## Extraction de clips

Vous pouvez extraire un extrait d’un fichier vidéo en utilisant `ffmpeg.extractClip`.

```js
const clip = await ffmpeg.extractClip("path_to_video", {
    start: "00:00:10",
    duration: 5,
})
```

:::note
Cette opération est assez rapide car elle ne nécessite pas de ré-encodage. Vous pouvez spécifier la taille de sortie mais cela sera beaucoup plus lent car cela nécessitera un ré-encodage.
:::

## Analyse des vidéos

Vous pouvez extraire les métadonnées d’un fichier vidéo en utilisant `ffmpeg.probe`.

```js
const info = await ffmpeg.probe("path_to_video")
const { duration } = info.streams[0]
console.log(`video duration: ${duration} seconds`)
```

## Options personnalisées pour ffmpeg

Vous pouvez personnaliser davantage la configuration de `ffmpeg` en passant `outputOptions`.

```js 'outputOptions: "-b:a 16k",'
const audio = await ffmpeg.extractAudio("path_to_video", {
    outputOptions: "-b:a 16k",
})
```

Ou interagir directement avec le constructeur de commandes `ffmpeg` (qui est le constructeur de commandes natif de [fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg)). Notez que dans ce cas, vous devez également fournir un « hash » de cache pour éviter le rerendu.

```js wrap
const custom = await ffmpeg.run(
    "src/audio/helloworld.mp4",
    (cmd) => {
        cmd.noAudio()
        cmd.keepDisplayAspectRatio()
        cmd.autopad()
        cmd.size(`200x200`)
        return "out.mp4"
    },
    { cache: "kar-200x200" }
)
```

## CLI

Le [cli](../../../reference/reference/cli/video/) prend en charge diverses commandes pour exécuter les transformations vidéo.

```sh
genaiscript video probe myvid.mp4
```