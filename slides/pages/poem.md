# Poet-moji script

<v-click>

```js
// poem.genai.mjs
$`Write a poem using emojis. Save it to poem.txt.`
```

</v-click>

<v-click>

````txt
// prompt.txt
Write a poem using emojis.
````
</v-click>

<v-click>

````json
// OpenAI API request
{   "model": "gpt-4o",
    "messages": [{ "role": "user", 
        "content": "Write a poem using emojis"}] }
````

</v-click>


<v-click>

````text
// OpenAI Text Response
FILE: poem.txt
🌅🌻🌞 🌳🍃🍂 🌙✨🌌 💤🌠🌙
````

</v-click>

<v-click>

```js
// poem.txt
🌅🌻🌞 🌳🍃🍂 🌙✨🌌 💤🌠🌙
```

</v-click>