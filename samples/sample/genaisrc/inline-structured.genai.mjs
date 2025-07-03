const researchQuestionsSchema = {
  type: "object",
  properties: {
    primaryQuestion: {
      type: "string",
      description: "The main research question",
    },
    searchQueries: {
      type: "array",
      items: { type: "string" },
      description: "Specific search queries to use for web searches",
    },
    subtopics: {
      type: "array",
      items: { type: "string" },
      description: "Subtopics to explore within the main topic",
    },
  },
  required: ["primaryQuestion", "searchQueries", "subtopics"],
};

const topic = "The weight of squirrels in urban environments";
const questionsResult = await runPrompt(
  (ctx) => {
    ctx.$`You are an expert researcher tasked with planning a comprehensive investigation on the topic: "${topic}".

Break down this topic into:
1. A clear primary research question
2. Specific search queries that would yield valuable information
3. Important subtopics that should be explored

Generate search queries that are specific, varied in perspective, and would provide comprehensive information.`;
  },
  {
    label: "generate_research_questions",
    model: "large",
    cache: "deep-research",
    responseSchema: researchQuestionsSchema,
  },
);

env.output.appendContent(MD.stringify(questionsResult.json, { headings: 1 }));
