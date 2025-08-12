script({
  title: "Simple Test",
  description: "Just tests basic functionality",
  group: "Basic Tests", 
  temperature: 0,
  tests: [
    {
      files: [],
      asserts: [
        {
          type: "icontains",
          value: "hello",
        },
      ],
    },
  ],
});

$`Just say hello world.`;