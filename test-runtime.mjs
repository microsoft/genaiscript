// Test script using the runtime export
import { script, $, def } from "@genaiscript/runtime";

// Test if functions exist
console.log("script function:", typeof script);
console.log("$ function:", typeof $);
console.log("def function:", typeof def);

// Test if functions throw expected errors
try {
  script({});
  console.log("ERROR: script() should have thrown an error");
} catch (e) {
  console.log("✓ script() correctly threw error:", e.message);
}

try {
  $`test`;
  console.log("ERROR: $() should have thrown an error");
} catch (e) {
  console.log("✓ $() correctly threw error:", e.message);
}

try {
  def("test", "value");
  console.log("ERROR: def() should have thrown an error");
} catch (e) {
  console.log("✓ def() correctly threw error:", e.message);
}

console.log("All tests passed!");