import { python } from "@genaiscript/plugin-pyodide";

script({
  model: "small",
  tests: {},
});
const py = await python();
const version = await py.run(`import sys
                              sys.version`);
console.log(version);
