
The `def` function will automatically parse XML files and extract text from them.

```javascript
def("DOCS", env.files) // contains some xml files
def("XML", env.files, { endsWith: ".xml" }) // only xml
```

## `parse`

The global `XML.parse` function reads an XML file and converts it to a JSON object.

```js "XML.parse"
const res = XML.parse('<xml attr="1"><child /></xml>')
```

Attribute names are prepended with "@\_".

```json
{
    "xml": {
        "@_attr": "1",
        "child": {}
    }
}
```

## RSS

You can use `XML.parse` to parse an RSS feed into a object.

```js "XML.parse"
const res = await fetch("https://dev.to/feed")
const { rss } = XML.parse(await res.text())
// channel -> item[] -> { title, description, ... }
```

Since RSS feeds typically return a rendered HTML description, you can use `parsers.HTMLToText` 
to convert it to back plain text.

```js
const articles = items.map(({ title, description }) => ({
    title,
    description: parsers.HTMLToText(description)
}))
```
