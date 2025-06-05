// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { stdout } from "./stdio.js";

// Boolean indicating if console supports colors
// Determines if the console supports color output based on terminal capability
export let consoleColors = !!stdout.isTTY;

/**
 * Enables or disables console color output.
 * Updates the global consoleColors flag based on the input.
 * @param enabled - Whether to enable or disable color output.
 */
export function setConsoleColors(enabled: boolean) {
  consoleColors = !!enabled;
}

/**
 * Wraps a message with ANSI color codes if colors are enabled.
 * @param n - The color code
 * @param message - The message to wrap
 * @returns The color wrapped message or the original message
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit
 */
/**
 * Wraps a message with ANSI escape codes for the specified color.
 * @param n - The ANSI color code or name to apply.
 * @param message - The message to wrap. Returns the original message if colors are disabled.
 */
export function wrapColor(n: number | string, message: string) {
  if (consoleColors) return `\x1B[${n}m${message}\x1B[0m`;
  else return message;
}

//for (let i = 0; i < 255; ++i)
/**
 * Wraps text with RGB ANSI color codes for foreground or background.
 * Converts an RGB integer to its red, green, and blue components and applies the corresponding ANSI escape codes.
 * Returns the original text if color output is disabled.
 * @param rgb - RGB color as a single integer.
 * @param text - Text to wrap with the color.
 * @param background - Optional. If true, applies the color to the background.
 */

export function wrapRgbColor(rgb: number, text: string, background?: boolean): string {
  if (!consoleColors) return text;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const rgbColorCode = `\x1b[${background ? "48" : "38"};2;${r};${g};${b}m`;
  const resetCode = `\x1b[0m`;
  return `${rgbColorCode}${text}${resetCode}`;
}
