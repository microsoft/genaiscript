import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

La dernière version inclut la prise en charge de l'inclusion de vidéos et de transcriptions audio dans vos scripts.

```js wrap
const frames = await ffmpeg.extractFrames("demo.mp4", {
  transcription: true,
});
def("DEMO", frames);

$`Describe what happens in the <DEMO>.`;
```

Supposons que vous souhaitiez analyser un fichier vidéo. Pour la plupart des LLM qui supportent les images, vous devrez extraire des captures d'écran à des horodatages précis, puis les envoyer sous forme de séquence d'images. Choisir ces horodatages peut être un défi car vous risquez d'épuiser la fenêtre de contexte. GenAIScript fournit des assistants pour résoudre ces tâches fastidieuses liées à l'analyse vidéo avec les LLM.

* consultez la [documentation](../../reference/scripts/videos/).

## outils et agents

Nous proposons également d'encapsuler les nouvelles fonctionnalités dans des [outils](../../reference/scripts/tools/) et des [agents](../../reference/scripts/agents/) afin que vous puissiez les utiliser dans vos scripts.

Par exemple, pour inclure l'outil d'extraction de frames afin que le LLM puisse l'appeler, vous pouvez utiliser l'extrait suivant :

```js wrap
script({
  tools: "video_extract_frames",
});
```

Ou laissez simplement l'agent travailler sur la vidéo pour vous.

```js wrap
script({
  tools: "agent_video",
});
```