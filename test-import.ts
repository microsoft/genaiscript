// Simple test to verify the TypeScript import works
import { script, $, def } from "genaiscript";

// This should just verify that the types are available
console.log("Functions imported successfully");
console.log("script:", typeof script);
console.log("$:", typeof $);
console.log("def:", typeof def);

export { script, $, def };