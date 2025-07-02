import sample from "../src/sample.json" with { type: "json" };

console.log(sample);
const { foo } = sample;
if (foo !== "bar") throw new Error("JSON module not loaded correctly");
