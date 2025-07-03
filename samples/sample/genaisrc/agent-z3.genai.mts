script({
  title: "Use Z3 tool to solve SMT2 problems",
  tools: ["agent_z3"],
});

const problem = await host.fetchText(
  "https://mindyourdecisions.com/blog/2018/09/06/send-more-money-a-great-puzzle/",
);
const problemText = await HTML.convertToMarkdown(problem.file.content);

def("PROBLEM3", problemText);
$`Solve the following problems:

Problem 1:
(declare-const a Int)
(declare-fun f (Int Bool) Int)
(assert (< a 10))
(assert (< (f a true) 100))
(check-sat)

Problem 2:
Imagine we have a number called 'a' that is smaller than 10. 
We also have a special machine called 'f' that takes a number and a 'true'/'false' answer, 
and it gives back another number. 
When we put the number 'a' and the answer “true” into this machine, 
the number it gives us is smaller than 100.

Problem 3:
The content is in <PROBLEM3> and is a puzzle.
`;
