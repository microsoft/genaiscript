const { dbg, output } = env;
// https://chatgpt.com/share/68072000-94e0-8006-99fc-d76df25100d8
const languages = [
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Dutch",
  "Arabic",
  "Japanese",
  "Korean",
];

// randomize the languages
languages.sort(() => Math.random() - 0.5);
languages.push("English"); // always finish with English

// grab the file to audio-ify
const file = env.files[0];
if (!file) cancel(`No file provided.`);

// start with a short summary in english
output.heading(3, "original");
const { text: original } =
  await prompt`Summarize ${file} into a short blog post excerpt. Single paragraph.`;
output.fence(original, "text");

let content = original;
for (const lang of languages) {
  output.heading(3, lang);
  const translated = await prompt`Translate <TEXT/> to ${lang}. This is IMPORTANT. 
        If you cannot help with the request, respond ':('.
        <TEXT>
        ${content}
        </TEXT>`.options({
    responseType: "text",
    systemSafety: false,
    model: "openai:gpt-4o",
  });
  output.fence(translated.text, "text");
  if (translated.text.includes(":(")) continue; // retry?
  const res = await speak(translated.text, {
    voice: "coral",
    instructions: `Podcast host, native, ${lang} accent`,
    model: "openai:gpt-4o-mini-tts",
  });
  output.audio(lang, res.filename);
  const transcription = await transcribe(
    { filename: res.filename },
    { model: "openai:gpt-4o-transcribe" },
  );
  if (transcription.error) output.fence(transcription.error);
  else {
    content = transcription.text;
    output.fence(content, "text");
  }
}

// compare with the original
output.heading(3, "final");
output.fence(content, "text");

output.diff(original, content);
