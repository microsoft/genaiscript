// Test how the existing genaiscript imports are used
import { classify } from "genaiscript/runtime";

console.log("classify function:", typeof classify);

// Test current import that should work
try {
  const result = classify("test", { a: "A", b: "B" });
  console.log("✓ classify import works correctly");
} catch (e) {
  console.log("✗ classify import failed:", e.message);
}

// Test the new imports that should be available
try {
  const { script, $, def } = await import("genaiscript");
  console.log("✓ New imports available");
  console.log("script:", typeof script);
  console.log("$:", typeof $);
  console.log("def:", typeof def);
} catch (e) {
  console.log("✗ New imports failed:", e.message);
}

console.log("Test complete!");