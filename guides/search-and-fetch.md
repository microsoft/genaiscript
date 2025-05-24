import { Steps } from '@astrojs/starlight/components';

Suppose we want to plan a weekend trip using a GenAIScript that
will help us plan by using web search to learn about things to do and the expected weather.

:::note

You will need a [Bing Web Search API key](/genaiscript/reference/scripts/web-search) to use `webSearch`.

:::

<Steps>

1. Use the `> GenAIScript: Create new script...` command in the command palette to create a new script.
2. Start the script by defining the model and title:
    ```js
    script({
        title: "plan-weekend",
        description: "Given details about my goals, help plan my weekend",
        model: "openai:gpt-4o",
    })
    ```
3. Use the [`webSearch`](/genaiscript/reference/scripts/web-search/) function to 
search for information about the destination. 
    If you don't have one, then you can search for the web pages manually and use the URLs directly
    in the call to the `host.fetchText` function.
    ```js
    const parkinfo = await retrieval.webSearch("mt rainier things to do")   
    ```
4. `webSearch` returns a list of URLs.  Use [`fetchText`](/genaiscript/reference/scripts/fetch/)
    to fetch the contents of the 1st URL.
    ```js
    const parktext = await host.fetchText(parkinfo.webPages[0])
    ```
5. `host.fetchText` returns a lot of formatting HTML tags, etc.
    Use [`runPrompt`](/genaiscript/reference/scripts/inline-prompts/)
    to call the LLM to clean out the tags and just keep the text.
    ```js
    const cleanInfo = await runPrompt(_ => {
        // use def, $ and other helpers
        _.def("INFO", parktext.text)
        _.$`You are an expert in web content. 
        Extract out of the file INFO, which is HTML with lots of CSS and HTML tags, 
        the important information that a human would want to know.`
    })
    ```
6. Repeat to get the latest weather info about your destination.
    ```js
    const weather = await retrieval.webSearch("mt rainier weather")
    ```
7. Replace the text `"TELL THE LLM WHAT TO DO..."` with what kind of
vacation you want to plan.
    ```js
    $`You are a helpful assistant that is an expert in planning weekend trips.
    I've included information about my destination in PARKINFO and WEATHER.
    Help me plan a weekend trip starting tomorrow.`
    ```
8. Press the "Run" button on the upper right corner of the editor to run the script. 
(You can run this script in this way because it takes no other input in `env.files`))

9. The output will be displayed in a new document tab.

</Steps>

Here's an example of the output you might get:

```plaintext wrap
Based on the information provided in PARKINFO and the various weather forecasts, here's a concise plan for your weekend trip to Mount Rainier National Park starting tomorrow:

Day 1: Arrival and Exploration
Morning: Arrive at the park via the Nisqually entrance, which is open year-round.
Afternoon: Visit Paradise, one of the most popular areas in the park. Check the weather before heading out, as the forecast suggests a heavy fall of snow and extremely cold temperatures. Dress warmly and carry snow chains if driving.
Evening: Have dinner at the Paradise Inn, if open, and stay overnight in the park or nearby accommodation.
```

Here's the complete GenAIScript:
```js wrap
script({
    title: "plan-weekend",
    description: "Given details about my goals, help plan my weekend",
    model: "openai:gpt-4o",
})

const parkinfo = await retrieval.webSearch("mt rainier things to do")
const parktext = await fetchText(parkinfo.webPages[0])

const cleanInfo = await runPrompt(_ => {
    // use def, $ and other helpers
    _.def("INFO", parktext.text)
    _.$`You are an expert in web content. 
    Extract out of the file INFO, which is HTML with lots of CSS and HTML tags, 
    the important information that a human would want to know.`
})

if (cleanInfo) def("PARKINFO", cleanInfo.text)

const weather = await retrieval.webSearch("mt rainier weather")
def("WEATHER", weather.webPages)

$`You are a helpful assistant that is an expert in planning weekend trips.
I've included information about my destination in PARKINFO and ${weather}.
Help me plan a weekend trip starting tomorrow.`
```