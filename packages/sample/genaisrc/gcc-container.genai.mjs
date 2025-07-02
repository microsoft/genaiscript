script({
  model: "large",
});
const container = await host.container({
  image: "gcc",
});
let sourceIndex = 0;
defTool(
  "gcc",
  "GNU Compiler Collection (GCC), C/C++ compiler. Use this tool to compile C/C++ source code.",
  {
    source: "",
  },
  async (args) => {
    const { source } = args;

    const fn = `tmp/${sourceIndex++}/main.c`;
    await container.writeText(fn, source);
    const res = await container.exec("gcc", [fn]);
    return res;
  },
);

$`Generate a valid C program that prints "Hello, World!" and use gcc to validate the syntax.`;
