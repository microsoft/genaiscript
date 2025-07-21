script({
  title: "image-to-mermaid",
  description: "Given an image of a diagram, generate mermaid code for it.",
  model: "vision",
  files: "src/robots.jpg",
});

defImages(env.files);

$`Given the image, generate a mermaid diagram based on the content of the image.`;
