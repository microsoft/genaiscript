import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { remarkDetails } from './remark-details'

const nestedMarkdown = `<details>
<summary>Outer</summary>
Before inner
<details>
<summary>Inner</summary>
Inner content
</details>
After inner
</details>`

console.log('Testing nested details...')

// Parse without plugin
const processor1 = unified().use(remarkParse)
const tree1 = processor1.parse(nestedMarkdown)
console.log('Without plugin:')
console.log(JSON.stringify(tree1, null, 2))

// Parse with plugin
const processor2 = unified().use(remarkParse).use(remarkDetails)
const tree2 = processor2.parse(nestedMarkdown)
const result2 = processor2.runSync(tree2)
console.log('\nWith plugin:')
console.log(JSON.stringify(result2, null, 2))