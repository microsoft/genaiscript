Ethan: Welcome to our presentation of GP tools in Visual Studio Code. We'll start by opening the GP spec file, which is a markdown file where we describe the task to do. In this example, we're going to implement an email validator.

Nancy: That's right, Ethan. The task is to write a function that takes a string and validates if the whole string is a valid email address. This description is in natural language, in what we call the GP spec file.

Ethan: Now, this GP spec file is run against a GP tool. The GP tools are JavaScript files defined in the project. Let's open the generated python GP tool, which has some metadata used to populate the UI, a programmatic way to access the context, and the typical prompt engineering using an intuitive syntax.

Nancy: From the user's perspective, they can take the code action tool and select the "generate python code" option. This will execute the GP tool against the GP spec and the rest of the context. The results are streamed in Visual Studio Code and previewed as a refactoring.

Ethan: That's right. We can see that a new file is parsed out, and an update to the file is made. If the user is happy with the changes, they can apply them just like any other refactoring. Next, they can run the test generation tool, which is another JavaScript file in the project.

Nancy: When running the test generation tool, we can see that it generates tests but uses the wrong framework. To fix this, the team can update the tool file. After updating the file, they can run the test tool again, and now it picks up the right test framework.

Ethan: Once the tests are generated, they can make sure the tests are passing. Now, let's say the customer changes their mind and decides that the function should also validate URLs. The user can update the spec to reflect this change and run the tool again.

Nancy: When running the tool again, it initially uses the wrong file. The user can refine the spec to use the same pipeline file, run the tool again, and now it regenerates the email validator. They can review the changes and apply them if they're satisfied.

Ethan: And that's it! Thank you for watching our presentation on GP tools in Visual Studio Code.

