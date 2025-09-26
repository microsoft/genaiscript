---
parameters:
  greeting:
    type: string
    default: "Hello"
  name:
    type: string
    default: "World"
  count:
    type: number
    default: 3
  includeEmoji:
    type: boolean
    default: true
---
{{greeting}} {{name}}! 

You have {{count}} new messages.

{% if includeEmoji %}🎉{% endif %}