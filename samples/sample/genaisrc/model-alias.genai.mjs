script({
  model: "foo",
  modelAliases: { foo: "echo" },
});

const foo = await host.resolveLanguageModel("foo");
console.log(`bar: ${JSON.stringify(foo)}`);

const bar = await host.resolveLanguageModel("bar");
console.log(`bar: ${JSON.stringify(bar)}`);

$`Write a poem.`;
