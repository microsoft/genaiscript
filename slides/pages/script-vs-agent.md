# GenAIScript and Agents
&nbsp;
### GenAIScript is a **GLUE** language, **NOT** an agent framework
- Goal to leverage, not reinvent (e.g., we connect to OpenAI functions)
- Focus on adapters into/out of LLM
- Agility is key value - keep up with rapid ecosystem evolution

&nbsp;
### Major differences
- GenAIScript has a **static** orchestration graph
    - You know  when the LLM is called and with what arguments
- GenAIScript applies LLMs in a **targeted** way, 
embedding the results into existing automation
- We bound the use of the LLM to a specific single request

