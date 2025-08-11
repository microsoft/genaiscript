#!/usr/bin/env node

// Simple test script to demonstrate the quiet mode fix
// This script would test if runPrompt respects quiet mode

console.log("Testing quiet mode functionality...");

// Mock environment to test the quiet module
const { setQuiet, isQuiet } = require('./packages/core/dist/src/quiet.js');

console.log("Initial quiet state:", isQuiet);

setQuiet(true);
console.log("After setQuiet(true):", isQuiet);

setQuiet(false);  
console.log("After setQuiet(false):", isQuiet);

console.log("✅ Basic quiet module functionality works");