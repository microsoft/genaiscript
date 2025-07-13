// https://www.llamaindex.ai/blog/boosting-rag-picking-the-best-embedding-reranker-models-42d079022e83

const num_questions_per_chunk = env.vars.questionsPerChunk || 2;

def("FILE", env.files)

$`Given the context information and not prior knowledge.
generate only questions based on the below query.

You are a Professor. Your task is to setup
${num_questions_per_chunk} questions for an upcoming
quiz/examination. The questions should be diverse in nature
across the document. The questions should not contain options, not start with Q1/ Q2.
Restrict the questions to the context information provided.`