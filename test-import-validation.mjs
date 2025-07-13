// Test import script to validate that the new imports work
import { script, $, def, writeText, defFileOutput } from "genaiscript";

// Test that the functions are available for import
console.log("✓ Successfully imported script:", typeof script);
console.log("✓ Successfully imported $:", typeof $);
console.log("✓ Successfully imported def:", typeof def);
console.log("✓ Successfully imported writeText:", typeof writeText);
console.log("✓ Successfully imported defFileOutput:", typeof defFileOutput);

// Test that they throw appropriate errors when used outside context
try {
  script({ title: "Test" });
  console.log("✗ script() should have thrown an error");
  process.exit(1);
} catch (e) {
  console.log("✓ script() correctly throws error:", e.message);
}

try {
  $`test template`;
  console.log("✗ $() should have thrown an error");
  process.exit(1);
} catch (e) {
  console.log("✓ $() correctly throws error:", e.message);
}

try {
  def("test", "value");
  console.log("✗ def() should have thrown an error");
  process.exit(1);
} catch (e) {
  console.log("✓ def() correctly throws error:", e.message);
}

try {
  writeText("test");
  console.log("✗ writeText() should have thrown an error");
  process.exit(1);
} catch (e) {
  console.log("✓ writeText() correctly throws error:", e.message);
}

try {
  defFileOutput("test.txt", "test file");
  console.log("✗ defFileOutput() should have thrown an error");
  process.exit(1);
} catch (e) {
  console.log("✓ defFileOutput() correctly throws error:", e.message);
}

console.log("✓ All import tests passed!");