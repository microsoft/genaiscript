script({ model: "none" });
const hello = await speak("Hello, world!", {
  model: "openai:gpt-4o-mini-tts",
  instructions: `dark tone`,
});
console.log(hello);
