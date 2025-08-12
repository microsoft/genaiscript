script({
  title: "Quick Test",
  description: "Tests that should complete quickly without timeout",
  group: "Timeout Tests",
  temperature: 0,
  tests: [
    {
      files: [],
      asserts: [
        {
          type: "icontains",
          value: "2",
        },
      ],
    },
  ],
});

$`What is 1 + 1? Just give me the number.`;