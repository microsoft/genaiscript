## Summary of Resources

The BICEP file creates the following Azure resources:
1. App Service Plan
2. Web App

## Resource Relationship Diagram

```mermaid
stateDiagram
    [*] --> AppServicePlan
    AppServicePlan --> WebApp
```

```js title="foo.genai.js"
$`Write a one sentence poem.`
```
