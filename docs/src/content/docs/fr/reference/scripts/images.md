---
title: Images
description: Découvrez comment ajouter des images aux invites pour les modèles
  d'IA prenant en charge les entrées visuelles, y compris les formats d'image et
  leur utilisation.
keywords: images in prompts, AI model images, visual inputs, image formats, OpenAI Vision
sidebar:
  order: 10

---

Les images peuvent être ajoutées à l'invite pour les modèles qui prennent en charge cette fonctionnalité (comme `gpt-4o`).
Utilisez la fonction **`defImages`** pour déclarer les images. Les images prises en charge varient
selon les modèles mais incluent généralement `PNG`, `JPEG`, `WEBP` et `GIF`. Les fichiers locaux et les URL sont pris en charge.

```js
defImages(env.files)
```

En savoir plus sur [OpenAI Vision](https://platform.openai.com/docs/guides/vision/limitations).

## URLs

Les URL publiques (qui ne nécessitent pas d'authentification) seront transmises directement à OpenAI.

```js wrap
defImages(
    "https://github.com/microsoft/genaiscript/blob/main/docs/public/images/logo.png?raw=true"
)
```

Les fichiers locaux sont chargés et encodés sous forme de données URI.

## Buffer, Blob, ReadableStream

La fonction `defImages` prend également en charge [Buffer](https://nodejs.org/api/buffer.html), [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob), [ReadableStream](https://nodejs.org/api/stream.html).

Cet exemple prend une capture d'écran de bing.com et l'ajoute aux images.

```js wrap
const page = await host.browse("https://bing.com")
const screenshot = await page.screenshot() // returns a node.js Buffer
defImages(screenshot)
```

## Détail

OpenAI prend en charge un champ "low" / "high". Une image avec un détail "low" sera réduite à une résolution de 512x512 pixels.

```js 'detail: "low"'
defImages(img, { detail: "low" })
```

## Rognage

Vous pouvez rogner une région d'intérêt à partir de l'image.

```js "crop: { x: 0, y: 0, w: 512, h: 512 }" wrap
defImages(img, { crop: { x: 0, y: 0, w: 512, h: 512 } })
```

## Rogner automatiquement

Vous pouvez également supprimer automatiquement les couleurs uniformes sur les bords de l'image.

```js "autoCrop" wrap
defImages(img, { autoCrop: true })
```

## Niveaux de gris

Vous pouvez convertir l'image en niveaux de gris.

```js "greyscale" wrap
defImages(img, { greyscale: true })
```

## Rotation

Vous pouvez faire pivoter l'image.

```js "rotate: 90"
defImages(img, { rotate: 90 })
```

## Échelle

Vous pouvez redimensionner l'image.

```js "scale: 0.5"
defImages(img, { scale: 0.5 })
```

## Renverser

Vous pouvez renverser l'image.

```js "flip: { horizontal: true; vertical: true }" wrap
defImages(img, { flip: { horizontal: true; vertical: true } })
```

## Largeur maximale, hauteur maximale

Vous pouvez spécifier une largeur maximale, une hauteur maximale. GenAIScript redimensionnera l'image pour s'adapter aux contraintes.

```js "maxWidth: 800" "maxHeight: 800"
defImages(img, { maxWidth: 800 })
// and / or
defImages(img, { maxHeight: 800 })
```

## Carrelage

Lorsque vous spécifiez l'option `tiled: true`, toutes les images seront
regroupées dans une seule image, après que toutes les transformations ont été appliquées.

L'image résultante sera ensuite redimensionnée pour respecter les contraintes de taille maximale de l'image.

```js "tiled: true"
defImages(env.files, { details: "low", tiled: true })
```
