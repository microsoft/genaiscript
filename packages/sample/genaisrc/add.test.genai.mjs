script({
    title: 'Simple Math Test',
    description: 'Validates that the model correctly calculates 1+1.',
    group: 'Basic Tests',
    temperature: 0,  
    maxTokens: 10, 
    tests: [
      {
        files: [],  
//        rubrics: ['output correctly calculates 1+1 as 2'],
//        facts: [`The model should return "2".`],
        asserts: [
          {
            type: 'icontains',
            value: '2', 
          },
        ],
      },
    ],
  });
  
  $`What is 1 + 1?`; 