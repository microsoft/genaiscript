import { Steps } from '@astrojs/starlight/components';

The quick-start guide illustrates how to write a GenAIScript that takes input from a pdf file.

<Steps>

1. Place your PDF document in a directory visible in VS Code Explorer
2. Use the `> GenAIScript: Create new script...` command in the command palette to create a new script.
3. Define and name the pdf file as an input:
    ```js
    const src = def("PDFSOURCE", env.files, { endsWith: ".pdf" })
    ```
4. Replace the text `"TELL THE LLM WHAT TO DO..."` with what you want it to do with your pdf file. Use the name in the def to refer to the file.
    ```js
    $`You are a helpful assistant.
    Summarize the content of ${src} and critique the document.
    `
    ```
6. Right click on the pdf document in VS Code Explorer. Select **Run GenAIScript**. Select the script you just wrote.
7. Output will be displayed in a new document tab.

</Steps>


### Example: Lorem Ipsum

In this example, we will extract text from a pdf that describes the history of Lorem Ipsem.

```js title="ask-my-pdf.genai.mjs" system=false
const src = def("PDFSOURCE", env.files, { endsWith: ".pdf" })
$`You are a helpful assistant.
Summarize the content of ${src} and critique the document.

- Only one paragraph. Keep it short.
`
```

{/* genaiscript output start */}

<details>
<summary>👤 user</summary>


````markdown wrap
PDFSOURCE:
```pdf file="src/samples/loremipsum.pdf"
Lorem Ipsum
"Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
velit..."
"There is no one who loves pain itself, who seeks after it and wants to have it, simply because it is pain..."

What is Lorem Ipsum?
Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley
of type and scrambled it to make a type specimen book. It has survived not only five centuries, but
also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in
the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more
recently with desktop publishing software like Aldus PageMaker including versions of Lorem
Ipsum.
Why do we use it?
It is a long established fact that a reader will be distracted by the readable content of a page when
looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution
of letters, as opposed to using 'Content here, content here', making it look like readable English.
Many desktop publishing packages and web page editors now use Lorem Ipsum as their default
model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various
versions have evolved over the years, sometimes by accident, sometimes on purpose (injected
humour and the like).

Where does it come from?
Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical
Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor
at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words,
consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical
literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and
1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written
in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The
first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those
interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are
also reproduced in their exact original form, accompanied by English versions from the 1914
translation by H. Rackham.

Where can I get some?
There are many variations of passages of Lorem Ipsum available, but the majority have suffered
alteration in some form, by injected humour, or randomised words which don't look even slightly
believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't
anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet
tend to repeat predefined chunks as necessary, making this the first true generator on the Internet.

-------- Page Break --------

It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures,
to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always
free from repetition, injected humour, or non-characteristic words etc.
```

You are a helpful assistant.
Summarize the content of PDFSOURCE and critique the document.

- Only one paragraph. Keep it short.
````


</details>


<details open>
<summary>🤖 assistant</summary>


```markdown wrap
The PDF "Lorem Ipsum" provides information about the origins and usage of the standard dummy text in the printing and typesetting industry. It explains the purpose of using Lorem Ipsum, its historical roots, and variations. However, it lacks visual aids or examples to enhance the understanding of the text distribution concept.
```


</details>

{/* genaiscript output end */}


