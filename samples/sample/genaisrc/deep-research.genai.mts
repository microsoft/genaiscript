script({
  title: "Deep Research",
  description:
    "Performs comprehensive research on a topic using web searches and multiple iterations",
  parameters: {
    topic: {
      description: "The topic to research",
      type: "string",
      default: "quantum computing advancements in the last year",
    },
    iterations: {
      description: "The number of research iterations to perform",
      type: "number",
      default: 3,
    },
  },
});
const { output, vars, generator } = env;
const { runPrompt } = generator;

// Define schemas for structured outputs
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

const searchAnalysisSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "Brief summary of the search results",
    },
    keyFindings: {
      type: "array",
      items: { type: "string" },
      description: "Key facts or findings from the search results",
    },
    newQuestions: {
      type: "array",
      items: { type: "string" },
      description: "New questions that arise from these findings",
    },
    sourcesQuality: {
      type: "number",
      minimum: 1,
      maximum: 10,
      description: "Rating of the quality of the sources (1-10)",
    },
  },
  required: ["summary", "keyFindings", "newQuestions", "sourcesQuality"],
};

const researchReportSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Descriptive title for the research report",
    },
    executiveSummary: {
      type: "string",
      description: "Concise summary of the entire research",
    },
    keyFindings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          finding: { type: "string" },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
          sources: { type: "array", items: { type: "string" } },
        },
        required: ["finding", "confidence"],
      },
    },
    gaps: {
      type: "array",
      items: { type: "string" },
      description: "Knowledge gaps that require further research",
    },
    furtherResearch: {
      type: "array",
      items: { type: "string" },
      description: "Suggested areas for further investigation",
    },
  },
  required: ["title", "executiveSummary", "keyFindings"],
};

/**
 * Main function to conduct deep research on a topic
 */
async function conductDeepResearch(topic: string, iterations: number = 3): Promise<any> {
  // Initialize research cache
  let researchMemory = {
    topic,
    startTime: new Date().toISOString(),
    iterations: 0,
    searches: [],
    findings: [],
    questions: {
      asked: [],
      pending: [],
    },
    sources: [],
    primaryQuestion: "",
    subtopics: [],
    completionTime: "",
    report: {},
  };

  // Step 1: Generate initial research questions if we don't have any
  if (!researchMemory.questions.asked?.length && !researchMemory.questions.pending?.length) {
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
    if (!questionsResult.json) throw new Error("Failed to generate research questions");
    researchMemory.primaryQuestion = questionsResult.json.primaryQuestion;
    researchMemory.questions.pending = questionsResult.json.searchQueries || [];
    researchMemory.subtopics = questionsResult.json.subtopics || [];
  }

  // Step 2: Iterative research loop
  while (researchMemory.iterations < iterations && researchMemory.questions.pending.length > 0) {
    // Get the next question to research
    const query = researchMemory.questions.pending.shift();
    researchMemory.questions.asked.push(query);
    researchMemory.iterations++;

    console.log(`Research iteration ${researchMemory.iterations}/${iterations}: "${query}"`);

    // Perform web search
    let searchResults;
    try {
      searchResults = await retrieval.webSearch(query, { count: 5 });
      console.log(`Found ${searchResults.length} search results`);
    } catch (error) {
      console.error("Search error:", error);
      searchResults = [];
    }

    if (searchResults.length === 0) {
      console.log("No search results found for query:", query);
      continue;
    }

    // Store source URLs
    searchResults.forEach((result) => {
      if (result.filename && !researchMemory.sources.includes(result.filename)) {
        researchMemory.sources.push(result.filename);
      }
    });

    // Format search results for analysis
    const searchContent = searchResults
      .map((result, index) => {
        const content = result.content || "No content available";
        return `[Source ${index + 1}: ${result.filename}]\n${content.substring(0, 2000)}...\n`;
      })
      .join("\n\n");

    // Analyze search results
    const analysisResult = await runPrompt(
      (ctx) => {
        ctx.def("SEARCH_RESULTS", searchContent);

        ctx.$`You are an expert research analyst. Review these search results for the query: "${query}" in <SEARCH_RESULTS>.

Analyze these results to identify:
1. Key findings and facts
2. New questions that arise from this information
3. Assess the quality and reliability of these sources (1-10 scale)`;
      },
      {
        label: `analyze_search_results_${researchMemory.iterations}`,
        model: "small", // Using the smaller model for search analysis
        cache: "deep-research",
        responseSchema: searchAnalysisSchema,
      },
    );

    // Store results in research memory
    researchMemory.searches.push({
      query,
      timestamp: new Date().toISOString(),
      sourcesCount: searchResults.length,
      analysis: analysisResult.json,
    });

    // Add findings and new questions
    researchMemory.findings = [
      ...researchMemory.findings,
      ...analysisResult.json.keyFindings.map((finding) => ({
        text: finding,
        query: query,
        sourcesQuality: analysisResult.json.sourcesQuality,
      })),
    ];

    // Add new questions to our research queue
    const newQuestions = analysisResult.json.newQuestions.filter(
      (q) =>
        !researchMemory.questions.asked.includes(q) &&
        !researchMemory.questions.pending.includes(q),
    );
    researchMemory.questions.pending.push(...newQuestions);
  }

  // Step 3: Generate comprehensive research report
  console.log("Generating final research report...");

  // Prepare findings for the report
  const allFindings = researchMemory.findings
    .map((f) => `- ${f.text} (Source: ${f.query}, Quality: ${f.sourcesQuality}/10)`)
    .join("\n");

  const report = await runPrompt(
    (ctx) => {
      ctx.def("RESEARCH_TOPIC", topic);
      ctx.def("PRIMARY_QUESTION", researchMemory.primaryQuestion);
      ctx.def("FINDINGS", allFindings);
      ctx.def("SEARCHES", researchMemory.questions.asked.join("\n- "));
      ctx.def("SOURCES", researchMemory.sources.join("\n- "));

      ctx.$`You are an expert researcher creating a comprehensive report on <RESEARCH_TOPIC>.

Create a structured research report with these elements:
1. A descriptive title
2. An executive summary of findings
3. Key findings with confidence levels
4. Knowledge gaps requiring further research
5. Recommendations for further research`;
    },
    {
      label: "generate_research_report",
      model: "large", // Using the larger model for the final synthesis
      cache: "deep-research",
      responseSchema: researchReportSchema,
    },
  );

  // Final update to research memory with completion info
  researchMemory.completionTime = new Date().toISOString();
  researchMemory.report = report.json;

  return {
    report: report.json,
    stats: {
      iterations: researchMemory.iterations,
      searchesConducted: researchMemory.questions.asked.length,
      findingsDiscovered: researchMemory.findings.length,
      sourcesConsulted: researchMemory.sources.length,
    },
  };
}

// Main execution
const { topic, iterations } = vars;
const result = await conductDeepResearch(topic, iterations);

output.appendContent("\n" + MD.stringify(result.report, { headings: 1 }));
