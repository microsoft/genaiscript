script({
  files: "docs/src/assets/*.png",
});
defImages(env.files, { tiled: true });
$`You are an expert at using DALL-E-3, an AI image generator.

Your task is to generate a base prompt that captures the style of the tiled images in the request. 
The base prompt will be used to generate new images that are similar to the ones in the request with DALL-E-3.
- all the images are tiled into a collage, ignore this fact.
`;
