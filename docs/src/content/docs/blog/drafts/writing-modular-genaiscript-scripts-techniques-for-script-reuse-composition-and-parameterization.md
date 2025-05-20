---
title: "Writing Modular GenAIScript Scripts: Techniques for Script Reuse,
  Composition, and Parameterization"
date: 2025-05-20
authors: genaiscript
draft: true
tags:
  - genaiscript
  - scripting
  - modularity
  - automation
  - prompt-design

---

# "Writing Modular GenAIScript Scripts: Techniques for Script Reuse, Composition, and Parameterization"

Building scalable, maintainable GenAIScript projects means going beyond single-use scripts. Modularization is key! In this post, we'll walk through a practical example showing how to write **modular GenAIScript scripts**—emphasizing script reuse, composition, and parameterization to create flexible automation workflows. 

If you want to accelerate your GenAIScript development and make your scripts easy to adapt, read on! 🚀

---

## Why Modularization? 🧩

- **Reuse**: Write once, use everywhere.
- **Maintainability**: Isolate code and update logic in one place.
- **Composability**: Build complex workflows out of small, well-defined modules.
- **Parameterization**: Let user input or automation decide the script’s behavior.

Now, let’s break down the featured script **line by line**, explaining how these practices come together!

---

## The Code — Line by Line

```js
// Modular GenAIScript Example: Techniques for Script Reuse, Composition, and Parameterization
```

This initial comment describes the script's intent—serving as a modular example for best practices.

---

### 1. Summarizing Documents with Parameterized Prompts

```js
// --- Module: summarizeDocument ---
// A reusable function to summarize a document with parameterized prompt
async function summarizeDocument({ document, summaryLength = "short" }) {
    def("doc", document);
    const prompt = summaryLength === "long"
        ? `Summarize the following document in detail.`
        : `Summarize the following document briefly.`;
    return await ai({
        prompt: `${prompt}\n\n{{doc}}`,
        temperature: 0.3
    });
}
```

**What’s happening here?**

- **Module comment**: Clearly names the module.
- **Reusable function**: `summarizeDocument` is self-contained. It takes an object parameter:
  - `document`: The text to summarize.
  - `summaryLength`: Optional; defaults to `"short"`, allowing the caller to customize the summary.
- **def("doc", document)**: Binds the input text to the variable `{{doc}}` in the prompt (see [genaiscript variables](https://microsoft.github.io/genaiscript/docs/reference/prompts/#prompt-variables)).
- **Prompt composition**: Chooses a different prompt template for long vs. short summaries.
- **ai({ ... })**: Calls the GenAIScript AI function, passing the crafted prompt and setting `temperature` for response variability.

**Result:** This module can be reused wherever a summary is needed, with flexible verbosity.

---

### 2. Extracting Keywords as a Reusable Module

```js
// --- Module: extractKeywords ---
// A reusable function to extract keywords from a document
async function extractKeywords({ document, maxKeywords = 5 }) {
    def("doc", document);
    return await ai({
        prompt: `Extract the top ${maxKeywords} keywords from the following document.\n\n{{doc}}`,
        temperature: 0.2
    });
}
```

- This function is focused on one job—extracting the most important keywords.
- **Parameters**:
  - `document`: The input to analyze.
  - `maxKeywords`: Limits the number of keywords returned; defaults to `5` but can be customized.
- **Prompt**: Injects the count and document into a clear instruction for the model.
- **Use of def and ai**: Just as above, keeping state management explicit and prompts clear.

**Benefit:** Keyword extraction logic is reusable throughout your scripts or pipelines.

---

### 3. Composing Complex Workflows from Modules

```js
// --- Module: composeAnalysis ---
// Composes reusable modules to create a complex workflow
async function analyzeDocument({ document, summaryLength, maxKeywords }) {
    const summary = await summarizeDocument({ document, summaryLength });
    const keywords = await extractKeywords({ document, maxKeywords });
    return {
        summary,
        keywords
    };
}
```

- **Composition**: This function demonstrates **composition**—it calls both `summarizeDocument` and `extractKeywords` with the same document and aggregates the results.
- **Destructuring & Forwarding Parameters**: Accepts user choices for summary length and keyword limit and passes them down to the respective modules.

**Modular advantage:** If you add more analytics functions later, they can simply be plugged in here, making scaling workflows a breeze.

---

### 4. Parameterized Script Entry Point

```js
// --- Parameterized Main Script ---
// Accepts user parameters for flexible automation
async function main({ filePath, summaryLength = "short", maxKeywords = 5 }) {
    // Load the document (assume loadText is globally available)
    const document = await loadText(filePath);
    const analysis = await analyzeDocument({ document, summaryLength, maxKeywords });
    print("Summary:\n" + analysis.summary);
    print("\nKeywords:\n" + analysis.keywords);
}
```

- **main function**: The script’s **entry point**—called by the CLI, by automated workflows, or from other scripts.
- **Parameters**:
  - `filePath`: Specifies the input file.
  - `summaryLength` and `maxKeywords`: Passed through to enable user-driven customization.
- **loadText**: Loads the document from the file (assumed ambient/global; see [global functions reference](https://microsoft.github.io/genaiscript/docs/reference/api/#globally-available-functions)).
- **analyzeDocument**: Orchestrates the composed analysis.
- **Output**: Results are printed in a clear, human-readable format.

---

### 5. Example Invocation

```js
// Example invocation (for CLI or test)
// main({ filePath: "input.txt", summaryLength: "long", maxKeywords: 10 });
```

- **Commented call**: Shows how to call the script from the CLI or test harness, passing all relevant parameters.

---

## Key Takeaways 🏆

- **Write small, focused modules**: Functions should do one thing and do it well.
- **Use parameters to maximize flexibility**: Allow users and automation to customize script behavior.
- **Compose complex flows from reusable modules**: Scale your workflow by composing simple building blocks—never duplicate logic.
- **Document each module’s purpose**: Clear comments and separation make onboarding and code updates easier.

---

## Explore Further

- [GenAIScript Documentation: Prompt Composition](https://microsoft.github.io/genaiscript/docs/reference/prompts/#prompt-variables)
- [TypeScript API Reference](https://microsoft.github.io/genaiscript/docs/reference/api/)
- [Sample GenAIScript Projects](https://github.com/microsoft/genaiscript/tree/main/packages/sample/src)

---

Modular script design helps you *think big, code small*. Happy scripting! 💡

If you have feedback or want to share your own GenAIScript modules, let us know!