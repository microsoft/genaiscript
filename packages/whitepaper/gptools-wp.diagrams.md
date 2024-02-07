### Diagram 1: genaiscript Workflow Overview

```mermaid
graph LR
F[User] --> G[gpspec]
G --> A[genaiscript]
A --> C[gpvm pre]
C --> D[Foundation Model]
D --> E[gpvm post]
E --> F[User]
```

This diagram illustrates the workflow of genaiscript, which includes the user, gpspec, genaiscript, gpvm, and foundation model. The user creates a gpspec, which instantiates a genaiscript. The gpvm executes the genaiscript with the gpspec, which invokes the foundation model. The foundation model returns a result to the gpvm, which postprocesses it and returns it to the user.

---

### Diagram 2: AI-Enhanced Workflow Process in genaiscript

```mermaid
graph LR
A[gpspec] --> B[genaiscript]
B --> C[gpvm]
C --> D[Foundation Model]
D --> E[AI-generated Output]
E --> F[Updated Context]
F --> G[User Interaction]
```

This diagram demonstrates the AI-enhanced workflow process in genaiscript. The gpspec instantiates the genaiscript, which interacts with the gpvm and foundation model. The AI-generated output is used to update the context, and the user interacts with the updated context through the genaiscript extension to VS code.

### Diagram 5: AI-Enhanced Workflow Process in genaiscript

```mermaid
sequenceDiagram
participant User
participant VSCode
participant gpspec
participant genaiscript
participant gpvm
User->>VSCode: Create/Edit gpspec
VSCode->>gpspec: Save gpspec
User->>VSCode: Invoke genaiscript
VSCode->>genaiscript: Execute genaiscript with gpspec context
genaiscript->>gpvm: Request foundation model execution
gpvm->>genaiscript: Return AI-generated output
genaiscript->>VSCode: Update context with output
VSCode->>User: Display updated context
```

This diagram demonstrates the AI-enhanced workflow process in genaiscript. The gpspec instantiates the genaiscript, which interacts with the gpvm and foundation model. The AI-generated output is used to update the context, and the user interacts with the updated context through the genaiscript extension to VS code.