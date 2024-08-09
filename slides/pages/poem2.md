# Poet-moji to file script
Poem generator to a file.

<v-click>

```js
// GenAIScript poem.genai.mjs
$`Write a poem using emojis.
  Save it to poem.txt.`
```

</v-click>

<v-click>

````txt
// prompt.txt
Write a poem using emojis.
Save it to poem.txt.
````
</v-click>

<v-click>

````json
// OpenAI API request
{ "messages": [
    { "role": "system", "content": "Use this format for files..."}] },
    { "role": "user", "content": "Write a poem using emojis. Save it to poem.txt."}, 
````

</v-click>


<v-click>

````text
// OpenAI Text Response
File: ./poem.txt
🌅🌻🌞 🌳🍃🍂 🌙✨🌌 💤🌠🌙
````

</v-click>

<v-click>

```js
// poem.txt
🌅🌻🌞 🌳🍃🍂 🌙✨🌌 💤🌠🌙
```

</v-click>