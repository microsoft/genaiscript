Certaines des [capacités de traitement vidéo](../../../reference/reference/scripts/videos/) sont également disponibles dans la CLI.

### `video probe`

Renvoie le résultat de `ffprobe` dans la console.

```sh
genaiscript video probe myvid.mp4
```

### `video extract-audio`

Extraie l'audio dans un format plus léger, optimisé pour la transcription.

```sh
genaiscript video extract-audio myvid.mp4
```

### `video extract-frames`

Extrait des captures d'écran de la vidéo. Vous pouvez spécifier des timestamps en secondes ou en `h:mm:ss`, ou un nombre de vidéos.

```sh
genaiscript video extract-video myvid.mp4
```