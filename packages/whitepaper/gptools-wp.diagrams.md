### Diagram 1: genaiscript Workflow Overview

```mermaid
graph LR
F[User] --> G[gpspec]
G --> A[gptool]
A --> C[gpvm pre]
C --> D[Foundation Model]
D --> E[gpvm post]
E --> F[User]
```

This diagram illustrates the workflow of genaiscript, which includes the user, gpspec, gptool, gpvm, and foundation model. The user creates a gpspec, which instantiates a gptool. The gpvm executes the gptool with the gpspec, which invokes the foundation model. The foundation model returns a result to the gpvm, which postprocesses it and returns it to the user.

---

### Diagram 2: AI-Enhanced Workflow Process in genaiscript

```mermaid
graph LR
A[gpspec] --> B[gptool]
B --> C[gpvm]
C --> D[Foundation Model]
D --> E[AI-generated Output]
E --> F[Updated Context]
F --> G[User Interaction]
```

This diagram demonstrates the AI-enhanced workflow process in genaiscript. The gpspec instantiates the gptool, which interacts with the gpvm and foundation model. The AI-generated output is used to update the context, and the user interacts with the updated context through the genaiscript extension to VS code.

### Diagram 5: AI-Enhanced Workflow Process in genaiscript

```mermaid
sequenceDiagram
participant User
participant VSCode
participant gpspec
participant gptool
participant gpvm
User->>VSCode: Create/Edit gpspec
VSCode->>gpspec: Save gpspec
User->>VSCode: Invoke gptool
VSCode->>gptool: Execute gptool with gpspec context
gptool->>gpvm: Request foundation model execution
gpvm->>gptool: Return AI-generated output
gptool->>VSCode: Update context with output
VSCode->>User: Display updated context
```

This diagram demonstrates the AI-enhanced workflow process in genaiscript. The gpspec instantiates the gptool, which interacts with the gpvm and foundation model. The AI-generated output is used to update the context, and the user interacts with the updated context through the genaiscript extension to VS code.