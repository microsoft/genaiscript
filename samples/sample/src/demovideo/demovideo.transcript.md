# Transcript

  This is a presentation of GP tools in visual studio code.  And we start by opening the GP spec file, which is a markdown file word to use a described as a task to do. And this example, we're going to have. Implement. An email validator.  We're the task is to write a function. taKes a string and.  Validates that the whole string.  Is a valid email address.  

So that's the description of the problem in natural language, in what we call the GP spec file.  And these GP fact file.  Is run against a GP tool. The GP tools are JavaScript files defined in the project. We're going to open the generated piped on GP tool.  Which has some metadata, which is used to populate the UI.  It has programatic way to access the, the context, including the content of the GP. B GP spec file.  And then it has the typ typical prompt engineering. Thing here using an intuitive syntax.  

fRom the user, who's writing the GP spec. We go in here and we take the code action tool. And we select the generated pipeline code. So this is going to. Execute the GP tool.  Against the GP spec and the rest of the context, the results are streamed.  In visual studio code and they're also previewed as a refactoring. So we can see that we parsed out. And you file here and we parsed out an update to the file. So if you're happy with that, you can go ahead and apply. The chains are applied, just like any other refactoring. And then why don't we can do now is go in and run the next tool, which is going to be. Test generation tool. So this is another JavaScript filed in project. We run that this is a different prompt. The prompt is about generating test.  Now, in this case, you can see that. It is generating tasks, but using the wrong fair mark.  So this is something that.  We want to fix, add team level. So we're going to go into the tools.  And we're going to update the tool. And this is something that.  THe team is using to generate test. So there we go. You used a union testimonial term for writing tests? We have updated.  The file that the tool file.  

Now let's go back and run the.  Run the test tool again.  

Can we update it?  To fight against. See, now that it is actually.  Picking up the right test framework, which is using our team.  Generating test cases.  

Can I apply that?  Let's get, make sure our tests, our tests are passing.  Now the customer changes mind. And decided that we also had to validate your ELLs. So we're going to go and update. The spec. So write a function via email address or your.  All right. And now I can run this.  

By applying the tool.  Jerry And code.  And we can see that it is. It is using the wrong, the wrong file. So I'm going to refine my spec and say that we should use the same pipeline file. This goes into the GSB spec file and run again.  

And now we're regenerating email validator, which we already have here.  

And we have a new refactoring, and if we can look at the diff, we can see that we've actually.  We've kept that function but we've added his valid url and then we also have the function that combines the two that the change does. good we can click apply  And that's it  Thank you for watching 