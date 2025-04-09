---
title: Support for Agentic tools
description: Agentic’s standard library of TypeScript AI tools are optimized for
  both TS-usage as well as LLM-based usage, which is really important for
  testing and debugging.
date: 2024-08-27
authors: pelikhan
cover:
  alt: Agentic project logo
  image: ./support-for-agentic-tools.png
tags:
  - JavaScript
  - Ecosystem
  - Integration
  - Tool Integration
excerpt: Agentic simplifies integrating TypeScript AI tools into your projects,
  offering seamless debugging and testing, especially for LLM-based workflows.
  It supports APIs like Bing, Wolfram Alpha, and Wikipedia, enhancing automation
  possibilities. Learn more about its features and documentation to streamline
  your development process.

---

[Agentic](https://agentic.so/) is a standard library of TypeScript AI tools optimized for both TS-usage as well as LLM-based usage, which is really important for testing and debugging.

Agentic brings support for a variety of online APIs, like Bing, Wolfram Alpha, Wikipedia, and more. You can register any [Agentic tool](https://agentic.so/tools/) in your script using `defTool`. Here's an example of how to use the Weather tool:

```js
import { WeatherClient } from "@agentic/weather"
const weather = new WeatherClient()
defTool(weather)
```

-   [Agentic documentation](https://agentic.so/sdks/genaiscript)
-   [GenAIScript documentation](https://microsoft.github.io/genaiscript/guides/agentic-tools/)
