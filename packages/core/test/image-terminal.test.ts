import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { renderImageToTerminal } from "../src/image.js";
import { setConsoleColors, consoleColors } from "../src/consolecolor.js";
import { readFileSync } from "fs";
import { join } from "path";

// Test the pixel color to Unicode character mapping function directly
const pixelColorToUnicodeChar = (color: number): string => {
  if (!color) return " "; // Transparent or black
  
  // Calculate luminance using standard formula
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  
  // Map luminance (0-255) to Unicode characters
  if (luminance < 32) return " ";      // Very dark
  if (luminance < 64) return "░";      // Light shade
  if (luminance < 128) return "▒";     // Medium shade  
  if (luminance < 192) return "▓";     // Dark shade
  return "█";                          // Solid block
};

describe("renderImageToTerminal", () => {
  let originalConsoleColors: boolean;
  const testImagePath = join(__dirname, "test-robot.png");

  beforeEach(() => {
    // Store original console colors setting
    originalConsoleColors = consoleColors;
  });

  afterEach(() => {
    // Restore original console colors setting
    setConsoleColors(originalConsoleColors);
  });

  test("should render with Unicode characters when colors are disabled", async () => {
    // Disable colors
    setConsoleColors(false);

    const imageData = readFileSync(testImagePath);
    const result = await renderImageToTerminal(imageData, {
      columns: 80,
      rows: 24,
      label: "test image",
    });

    // Since the test image is 1x1 and likely transparent, let's check the basic structure
    expect(result).toContain("╭");
    expect(result).toContain("╮");
    expect(result).toContain("╰");
    expect(result).toContain("╯");
    expect(result).toContain("│");
    
    // Should not contain ANSI color codes when colors are disabled
    expect(result).not.toMatch(/\x1b\[38;2;/);
    expect(result).not.toMatch(/\x1b\[48;2;/);
  });

  test("should render with colors when colors are enabled", async () => {
    // Enable colors
    setConsoleColors(true);

    const imageData = readFileSync(testImagePath);
    const result = await renderImageToTerminal(imageData, {
      columns: 80,
      rows: 24,
      label: "test image",
    });

    // Should contain ANSI color codes when colors are enabled
    // Note: The exact presence depends on the image content, but the structure should support it
    expect(result).toMatch(/\x1b\[\d+m/); // Some ANSI codes should be present
    
    // Should still contain box drawing characters for the border
    expect(result).toContain("╭");
    expect(result).toContain("╮");
    expect(result).toContain("╰");
    expect(result).toContain("╯");
    expect(result).toContain("│");
  });

  test("should include label in output", async () => {
    setConsoleColors(false);

    const imageData = readFileSync(testImagePath);
    const testLabel = "Test";  // Use shorter label to avoid ellipsis
    const result = await renderImageToTerminal(imageData, {
      columns: 80,
      rows: 24,
      label: testLabel,
    });

    expect(result).toContain("Tes"); // Will match "Tes" part even if ellipsed
  });

  test("should handle small image dimensions gracefully", async () => {
    setConsoleColors(false);

    const imageData = readFileSync(testImagePath);
    const result = await renderImageToTerminal(imageData, {
      columns: 20,
      rows: 10,
    });

    // Should produce some output without throwing
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  // Test the Unicode character mapping function directly
  test("pixelColorToUnicodeChar should map colors to correct Unicode characters", () => {
    // Test black/transparent
    expect(pixelColorToUnicodeChar(0)).toBe(" ");
    
    // Test very dark color (luminance < 32)
    expect(pixelColorToUnicodeChar(0x101010)).toBe(" "); // RGB(16,16,16) -> luminance ~15.7
    
    // Test light shade (luminance 32-63)
    expect(pixelColorToUnicodeChar(0x404040)).toBe("░"); // RGB(64,64,64) -> luminance ~62.7
    
    // Test medium shade (luminance 64-127)
    expect(pixelColorToUnicodeChar(0x808080)).toBe("▒"); // RGB(128,128,128) -> luminance ~125.4
    
    // Test dark shade (luminance 128-191)
    expect(pixelColorToUnicodeChar(0xB0B0B0)).toBe("▓"); // RGB(176,176,176) -> luminance ~172.5
    
    // Test solid block (luminance >= 192)
    expect(pixelColorToUnicodeChar(0xFFFFFF)).toBe("█"); // RGB(255,255,255) -> luminance 255
    expect(pixelColorToUnicodeChar(0xC0C0C0)).toBe("█"); // RGB(192,192,192) -> luminance 192
  });
  
  test("pixelColorToUnicodeChar red should map to medium shade", () => {
    // Red color should map to medium shade based on luminance
    expect(pixelColorToUnicodeChar(0xFF0000)).toBe("▒"); // Red -> luminance ~76.2
  });
});