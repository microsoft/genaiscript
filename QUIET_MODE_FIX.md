# Fix for Issue #1801: Quiet Mode for runPrompt

## Problem
When a `runPrompt` is executed in `quiet` mode, the output was still being sent to stdout and stderr, even when the CLI `--quiet` flag was used.

## Root Cause
The console logging functions in `packages/core/src/runpromptcontext.ts` were not checking the `isQuiet` flag before writing to stdout/stderr.

## Solution
Modified the console logging functions to respect the `isQuiet` flag:

### Changes Made

1. **Added import of quiet module** in `runpromptcontext.ts`:
   ```typescript
   import { isQuiet } from "./quiet.js";
   ```

2. **Modified console.log function** to check quiet mode:
   ```typescript
   log: (...args: any[]) => {
     const line = consoleLogFormat(...args);
     if (line) {
       trace?.log(line);
       if (!isQuiet) {
         stdout.write(line + "\n");
       }
     }
   },
   ```

3. **Modified image generation output** to respect quiet mode:
   ```typescript
   if (consoleColors && !isQuiet) {
     // stderr.write for image terminal rendering
   }
   ```

### Testing
- Created comprehensive tests in `packages/core/test/quiet.test.ts`
- Tests verify that stdout.write is not called when `isQuiet` is true
- Tests verify that trace logging still works in quiet mode

## Impact
- ✅ `runPrompt` console output now respects the `--quiet` CLI flag
- ✅ Image generation output is also suppressed in quiet mode
- ✅ Trace logging continues to work for debugging purposes
- ✅ Existing functionality is preserved when not in quiet mode

## Files Modified
- `packages/core/src/runpromptcontext.ts` - Main fix
- `packages/core/test/quiet.test.ts` - Tests

## Verification
The fix ensures that when using `genaiscript run --quiet script.genai.mts`, inner `runPrompt` calls will not emit output to stdout/stderr, making the overall execution truly quiet.