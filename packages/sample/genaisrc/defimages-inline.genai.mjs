script({
  files: ["src/robots.jpg", "src/vision/apollo11.jpg"],
  model: "vision",
});
const res = await runPrompt((_) => {
  _.defImages(env.files);
  _.$`give keywords describing for each image`;
});
