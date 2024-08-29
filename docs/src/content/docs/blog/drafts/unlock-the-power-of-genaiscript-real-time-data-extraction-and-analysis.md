---
title: "Unlock the Power of GenAIScript: Real-Time Data Extraction and Analysis"
date: 2024-08-26
authors: genaiscript
draft: true
tags:
  - GenAIScript
  - Data Analysis
  - Real-Time
  - IoT
  - Web Data
  - JSON

---

# "Unlock the Power of GenAIScript: Real-Time Data Extraction and Analysis" 🚀

In today's fast-paced world, real-time data extraction and analysis are crucial for making informed decisions. With GenAIScript, you can leverage its powerful capabilities to dynamically fetch and analyze data from various sources such as web pages, local files, and even IoT devices. In this blog post, we'll walk you through a script that showcases these features. Let's dive in! 💡

## The Script 📝

Here's the complete script we will be discussing:

```javascript
async function fetchDataAndAnalyze() {
  // Fetch data from a web page
  const { text: webText } = await fetchText('https://example.com/data');
  const webData = webText ? JSON.parse(webText) : null;

  // Fetch data from a local JSON file
  const localData = await workspace.readJSON('data/local-data.json');

  // Fetch data from an IoT device API
  const { text: iotText } = await fetchText('https://iot.example.com/api/data');
  const iotData = iotText ? JSON.parse(iotText) : null;

  // Combine and analyze data
  const combinedData = {
    web: webData,
    local: localData,
    iot: iotData,
  };

  // Perform some analysis (example: count total items)
  const totalItems = (webData?.items?.length || 0) + (localData?.items?.length || 0) + (iotData?.items?.length || 0);

  // Output the result
  def('ANALYSIS_RESULT', { totalItems, combinedData });
}

fetchDataAndAnalyze();
```

Now, let's break it down step-by-step!

### 1. Fetch Data from a Web Page 🌐

```javascript
const { text: webText } = await fetchText('https://example.com/data');
const webData = webText ? JSON.parse(webText) : null;
```

- **`fetchText('https://example.com/data')`**: This function fetches text data from the specified URL.
- **`const { text: webText }`**: We destructure the response to get the text content.
- **`JSON.parse(webText)`**: If the text exists, we parse it as JSON. Otherwise, `webData` is set to `null`.

### 2. Fetch Data from a Local JSON File 📁

```javascript
const localData = await workspace.readJSON('data/local-data.json');
```

- **`workspace.readJSON('data/local-data.json')`**: This function reads a JSON file from the local workspace directory. The result is stored in `localData`.

### 3. Fetch Data from an IoT Device API 📡

```javascript
const { text: iotText } = await fetchText('https://iot.example.com/api/data');
const iotData = iotText ? JSON.parse(iotText) : null;
```

- **`fetchText('https://iot.example.com/api/data')`**: This function fetches text data from the IoT device API.
- **`const { text: iotText }`**: We destructure the response to get the text content.
- **`JSON.parse(iotText)`**: If the text exists, we parse it as JSON. Otherwise, `iotData` is set to `null`.

### 4. Combine and Analyze Data 🔍

```javascript
const combinedData = {
  web: webData,
  local: localData,
  iot: iotData,
};
```

- **`const combinedData`**: We combine the fetched data into a single object for further analysis.

### 5. Perform Analysis (Count Total Items) 📊

```javascript
const totalItems = (webData?.items?.length || 0) + (localData?.items?.length || 0) + (iotData?.items?.length || 0);
```

- **`totalItems`**: We calculate the total number of items across all data sources. The `?.` operator ensures that we handle cases where the data might be `null`.

### 6. Output the Result 🏁

```javascript
def('ANALYSIS_RESULT', { totalItems, combinedData });
```

- **`def('ANALYSIS_RESULT', { totalItems, combinedData })`**: This function defines and outputs the result of our analysis.

### 7. Execute the Function 🚀

```javascript
fetchDataAndAnalyze();
```

- **`fetchDataAndAnalyze()`**: We call our function to execute the data fetching and analysis.

## Conclusion 🎉

By leveraging GenAIScript, we can seamlessly integrate and analyze data from multiple sources in real-time. This powerful capability opens up a world of possibilities for dynamic data-driven applications. We hope this guide has provided you with a clear understanding of how to harness the power of GenAIScript for real-time data extraction and analysis.

Happy scripting! 😃

For more information, check out the [official GenAIScript documentation](https://microsoft.github.io/genaiscript/).