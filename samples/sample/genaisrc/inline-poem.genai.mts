const res = await runPrompt(
  (_) => {
    _.$`write a short poem in emojis`;
  },
  {
    model: "large",
  },
);
console.log(res.error?.message);
console.log(res.text);
