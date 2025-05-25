---
title: '"State Management in GenAIScript: Persisting and Sharing Data Across
  Script Runs"'
date: 2025-05-21
authors: genaiscript
draft: true
tags:
  - genaiscript
  - state
  - scripting
  - cache
  - tutorial
  - workspace

---

# "State Management in GenAIScript: Persisting and Sharing Data Across Script Runs" 🚦

Managing state is vital for building interactive GenAIScript scripts that remember data between runs! In this tutorial, we’ll step through a script that demonstrates how to persist and share data using the GenAIScript workspace cache. Let’s dive into the annotated code and see how every piece works.

---

## The Code: Annotated and Explained

```js
// GenAIScript: State Management Demo
// Demonstrates persisting and sharing data across script runs using a workspace cache
```

**What’s happening?**  
A comment header introduces the script. It clearly states the script’s intent: showing how to persist and retrieve state in GenAIScript using a cache.

---

```js
// Define the cache name for state persistence
const CACHE_NAME = "genaiscript-demo-state";
```
**Why?**  
This line sets a constant `CACHE_NAME`, which acts as a *unique identifier* for all cached state related to this script. By naming the cache, you prevent clashes with other scripts! 🏷️

[Documentation: Caching](https://microsoft.github.io/genaiscript/reference/globals/#workspacecache)

---

```js
/**
 * Load state from cache or initialize if not present
 * @returns {Promise<{ counter: number, notes: string[] }>}
 */
async function loadState() {
    const cache = workspace.cache(CACHE_NAME);
    let state = await cache.get("state");
    if (!state) {
        state = { counter: 0, notes: [] };
        await cache.set("state", state);
    }
    return state;
}
```

**Step-by-step:**

- Declare an `async function loadState()`: utility to get or create the state.
- `const cache = workspace.cache(CACHE_NAME);`: Get the cache object tied to your chosen name. `workspace.cache` is a built-in global.
- `let state = await cache.get("state");`: Try to fetch stored state. `"state"` is the key within this cache namespace.
- If no state is found, initialize it to `{ counter: 0, notes: [] }` and persist it using `await cache.set("state", state);`.
- Finally, return the state object.

**Result:**  
Your script can always recover its previous state, or start fresh if it’s the first run!

---

```js
/**
 * Save state to cache
 * @param {object} state
 */
async function saveState(state) {
    const cache = workspace.cache(CACHE_NAME);
    await cache.set("state", state);
}
```

**Step-by-step:**

- Defines `saveState` as a helper to write updated state back to the cache.
- Uses the same cache and key as before, ensuring consistency.

---

```js
/**
 * Main script logic
 */
async function main() {
    trace.heading(1, "GenAIScript State Management Demo");
```

**What’s happening?**  
The `main` function contains the interactive logic.  
`trace.heading(1, ...)` prints a prominent heading to the trace output, making your logs clear and readable.

---

```js
    let state = await loadState();
    trace.p(`Current counter: ${state.counter}`);
    trace.p(`Notes: ${state.notes.length > 0 ? state.notes.join(", ") : "(none)"}`);
```

**What’s happening?**

- Loads the current/persisted state.
- Displays the current value of `counter`.
- Lists any saved notes, or prints `(none)` if there are none.

---

```js
    // Ask user for action
    const action = await user_input_select({
        message: "What would you like to do?",
        choices: [
            { value: "increment", label: "Increment Counter" },
            { value: "add_note", label: "Add Note" },
            { value: "reset", label: "Reset State" },
            { value: "exit", label: "Exit" }
        ]
    });
```

**What’s happening?**

- Asks the user to choose an action from a menu using `user_input_select`.
- The choices allow incrementing the counter, adding a note, resetting state, or exiting.

[Documentation: User Input](https://microsoft.github.io/genaiscript/reference/globals/#user_input_select)

---

```js
    if (action === "increment") {
        state.counter++;
        trace.p("Counter incremented.");
        await saveState(state);
        return main();
    } else if (action === "add_note") {
        const note = await user_input_text({ message: "Enter a note to add:" });
        if (note && note.trim()) {
            state.notes.push(note.trim());
            trace.p("Note added.");
            await saveState(state);
        } else {
            trace.warn("No note entered.");
        }
        return main();
    } else if (action === "reset") {
        state = { counter: 0, notes: [] };
        await saveState(state);
        trace.p("State reset.");
        return main();
    } else {
        trace.p("Exiting. State persisted for next run.");
    }
}
```

**Let’s break it down:**

- If the user picks **Increment Counter**, the counter goes up by 1, saved, and the script recursively restarts for more actions.
- If the user picks **Add Note**:
  - Prompts for a text note via `user_input_text`.
  - If a valid note is provided, trims and appends it to `state.notes`, saves everything, and restarts.
  - If the note is empty, warns user and restarts.
- If the user picks **Reset State**:
  - Resets state to its initial form, saves, informs the user, and restarts.
- If **Exit** is picked, a message is shown and the script ends (but retains state in cache for next time).

[Documentation: Trace Output](https://microsoft.github.io/genaiscript/reference/globals/#trace)  
[Documentation: User Input](https://microsoft.github.io/genaiscript/reference/globals/#user_input_text)

---

```js
// Start the script
main();
```

**How it all kicks off:**  
Calls `main()` to begin interactive execution!

---

## Summary: Bringing It All Together 🚀

This script illustrates how to:

- Use the workspace cache to persist structured state (like counters and notes).
- Prompt users for input, modify state, and persist changes.
- Build interactive flows that “remember” prior interactions across script runs.

This enables far richer GenAIScript CLI experiences, from basic personal trackers to shared multi-step processes.

**Want to see more examples?**  
Browse more at:  
[GenAIScript Sample Scripts](https://github.com/microsoft/genaiscript/tree/main/packages/sample/src)

**Official reference docs:**  
https://microsoft.github.io/genaiscript/reference/

Happy scripting—your scripts can now *remember*! 🧠✨