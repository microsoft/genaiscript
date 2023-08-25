# Exploring CoArch with the mywordle Sample

# Prompts

There are 5 general prompts in this directory that are intended to reflect 4 personas associated with software development.  These prompts appear in the "appdev" folder of the prompts menu.

- **PM-planning.prompt.js** - This prompt takes a project description in a ```<app>.coarch.md``` file (a paragraph describing the application), and generates another file, ```<app>.pm.coarch.md``` that expands the contents the project description to include specific instructions for the software architect, the software developer, quality assurance engineer, and the technical writer on their roles in the project.
- **SA-planning.js** - This prompt takes the contents of the ```<app>.om.coarch.md``` and generates a new CoArch file (```<app>.pm.saplan.coarch.md```) with detailed instructions for the software developer.  It expands the general guidance to include specific aspects of the application, including what files it should contain and how they interact.
- **SDE-Coding** - This prompt takes the ```<app>.pm.saplan.coarch.md``` file, including descriptions of the files and the interfaces between them, and generates Python code to implement the application.
- **SDE-update** - When the implementation has been generated and the developer wants to make an update, they can run this prompt over the ```<app>.pm.saplan.coarch.md``` file to update the implementation files. The prompt looks in the file ```bugnotes.md``` for a list of bugs and updates the implementation files to fix the bugs.  
- **QA-coding.js** - This prompt takes ```<app>.pm.saplan.coarch.md``` and generates a set of test files that test the components of the application as specified by the architect.

# CoArch Workflow

We start the workflow from a simple heading and short description. In this example, we are building a command line Wordle game but the prompts are general and can work for other applications as well.  Here is the starting point for the Wordle application.

```
# Create a command-line version of the popular Wordle application

## Idea
This application implements Wordle as a command line application. The rules follow the rules of the popular game. The game picks a random hidden 5-letter word from a dictionary of legal words. The user provides a 5-letter word and the game shows the user which of the letters in their word is (1) in the hidden word and (2) whether that letter is in the correct position. The user then offers another 5-letter word. 
If the users' word is an illegal word, the game should tell the user it is illegal, give no feedback except to
request another word until they type a legal word.
They have a total of 6 guesses. Illegal guess don't count against their total.
If they guess the hidden word they win. If they lose, the game should show them the hidden word. The game should use graphical elements similar to the Web-based version to show which of their letters was in the hidden word or in the correct location.
After each turn the user feedback should include exactly what letters are correct and if letters appear in the correct position, 
it should say what position they are in.  The game should also print out the hidden word at the end when the user quits.
```

Generation steps:
1. Place the description above in ```<app>.coarch.md```
2. Run the PM-planning prompt over the file to expand the description to generate ```<app>.pm.coarch.md```
3. Run the SA-planning prompt over the same file to generate the file ```<app>.pm.saplan.coarch.md```
4. Run the SDE-coding prompt over the ``<app>.pm.saplan.coarch.md`` file to generate a set of Python files that implement the application.
5. Test the application, identify bugs and or feature changes, and add notes about them to the ```bugnotes.md``` file.
6. Run the SDW-update prompt over the ```<app>.pm.saplan.coarch.md``` file to update the implementation files to fix the bugs.
6. To create unit tests for the python files generated for the application, 
run the QA-coding prompt over the ```<app>.saplanning.coarch.md``` file.  This should
generate parallel test files to the previous .py files as well as a file that can run all the tests from the command line.  (not yet implemented)

# Running the application

The Python files in the application directory were generated using the process above and edited either by hand or by rewriting the architecture document and rerunning the SDE prompts. The file 
main.py in the sample directory was generated using the process above and it implements a command line version of Wordle.  You run it with:
```python main.py```