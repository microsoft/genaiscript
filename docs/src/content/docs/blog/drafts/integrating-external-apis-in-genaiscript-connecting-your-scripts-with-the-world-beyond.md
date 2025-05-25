---
title: "Integrating External APIs in GenAIScript: Connecting Your Scripts with
  the World Beyond"
date: 2025-05-25
authors: genaiscript
draft: true
tags:
  - GenAIScript
  - API
  - prompt engineering
  - scripting
  - JavaScript
  - external data

---

# Integrating External APIs in GenAIScript: Connecting Your Scripts with the World Beyond

Ever wondered how you can make your GenAIScript prompts truly dynamic? By tapping into external APIs, your scripts can fetch real-time data straight from the web—think current weather, news, or anything else with a public API. In this post, we'll walk through how to integrate an external API in a GenAIScript script, explaining every line of code along the way. 🌍🔗

---

## Step-by-Step Guide: Calling an API in GenAIScript

Let's dive into an example where we fetch the current weather in Seattle using the [Open-Meteo API](https://open-meteo.com/). You can use this pattern for *any* external REST endpoint!

```js
script({
    title: "Integrating External APIs in GenAIScript",
    description: "Demonstrates connecting GenAIScript scripts to external APIs and using their data.",
    model: "openai:gpt-4o",
})

// Example: fetch current weather data from Open-Meteo API for a location
const lat = 47.6062 // Seattle latitude
const lon = -122.3321 // Seattle longitude
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`

const response = await host.fetchJson(url)
if (!response || !response.current_weather) {
    throw new Error("Failed to fetch weather data from Open-Meteo API.")
}
def("WEATHER", response.current_weather)

$`You are a helpful assistant. Here is the current weather in Seattle:
Temperature: ${response.current_weather.temperature}°C
Wind Speed: ${response.current_weather.windspeed} km/h
Weather Code: ${response.current_weather.weathercode}`
```

---

### Code Breakdown

Let's explore what each line does!

#### Setting Up the Script

```js
script({
    title: "Integrating External APIs in GenAIScript",
    description: "Demonstrates connecting GenAIScript scripts to external APIs and using their data.",
    model: "openai:gpt-4o",
})
```
- **`script({...})`:** This function defines the script's metadata.
    - `title`: A human-readable name for your script.
    - `description`: Explains what the script does.
    - `model`: Specifies the LLM model to use, from your available [providers](https://microsoft.github.io/genaiscript/docs/prompt/#model-selection).

#### Setting the Location Coordinates

```js
const lat = 47.6062 // Seattle latitude
const lon = -122.3321 // Seattle longitude
```
- **`lat` & `lon`:** We define the latitude and longitude for Seattle. You can change these for any location!

#### Constructing the API URL

```js
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
```
- **Dynamic URL:** We build the API URL using template literals, inserting the latitude and longitude values.
- **Purpose:** This request will return the current weather for the provided coordinates.

#### Fetching Data from the API

```js
const response = await host.fetchJson(url)
```
- **`host.fetchJson(url)`:** This built-in function sends a GET request and parses the response as JSON. It's perfect for quick and simple API calls inside GenAIScript prompts (see [host features in the docs](https://microsoft.github.io/genaiscript/docs/prompt/#host-object)).
- **`await`:** The request is asynchronous—`await` pauses execution until a response is received.

#### Handling Errors

```js
if (!response || !response.current_weather) {
    throw new Error("Failed to fetch weather data from Open-Meteo API.")
}
```
- **Error Handling:** If the response or the necessary data is missing, throw an error to stop the script and provide feedback.

#### Storing API Data for Later Use

```js
def("WEATHER", response.current_weather)
```
- **`def("NAME", value)`:** This helper defines a variable, `WEATHER`, that you can reference anywhere later in your script. Read more about [variables in GenAIScript](https://microsoft.github.io/genaiscript/docs/prompt/#variables).

#### Using Interpolated Output in the Prompt

```js
$`You are a helpful assistant. Here is the current weather in Seattle:
Temperature: ${response.current_weather.temperature}°C
Wind Speed: ${response.current_weather.windspeed} km/h
Weather Code: ${response.current_weather.weathercode}`
```
- **Template Literals & `$``...```:** This outputs a prompt string with the fetched data filled in.
- **AI Role Prompt:** The string is provided as the prompt for the LLM, letting your assistant reference real-world, up-to-date information.

---

## 📗 Where Do I Go From Here?

You now have a fully working example of GenAIScript calling an external API and passing its data into a prompt. Adapt the example to call *any* API, retrieve financial data, search, or anything your project requires!

- Dive deeper in the [GenAIScript documentation](https://microsoft.github.io/genaiscript/)
- Explore more [sample scripts](https://github.com/microsoft/genaiscript/tree/main/packages/sample/src)
- Experiment by chaining API calls, user input, and LLM output for rich automations!

Happy scripting! 🚀