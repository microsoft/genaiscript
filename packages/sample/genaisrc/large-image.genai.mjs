script({
  title: "Image Processor",
  description: "Image processing and manipulation.",
  model: "large",
  files: "src/robots.jpg",
});

for (const image of env.files) {
  const res = await runPrompt(
    (_) => {
      _.def("image", image);
      _.$`Analyze the <image> and provide a detailed description of its content, including colors, shapes, and any text present. The image is in PNG format.`;
    },
    {
      responseSchema: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "A detailed description of the image content.",
          },
        },
      },
    },
  );
  env.output.appendContent(res.json);
}
