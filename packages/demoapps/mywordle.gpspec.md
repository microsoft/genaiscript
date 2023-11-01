#  MyWordle Application Description

-   [mywordle.saplan.gpspec.md](mywordle.saplan.gpspec.md)
-   [mywordle.py](mywordle.py)
-   [test_mywordle.py](test_mywordle.py)

## Idea
This application implements Wordle as a command line application. The rules follow the rules of the popular game. The game picks a random hidden 5-letter word from a dictionary of legal words. The user provides a 5-letter word and the game shows the user which of the letters in their word is (1) in the hidden word and (2) whether that letter is in the correct position. The user then offers another 5-letter word. 
If the users' word is an illegal word, the game should tell the user it is illegal, give no feedback except to
request another word until they type a legal word.
They have a total of 6 guesses. Illegal guess don't count against their total.
If they guess the hidden word they win. If they lose, the game should show them the hidden word. The game should use graphical elements similar to the Web-based version to show which of their letters was in the hidden word or in the correct location.
After each turn the user feedback should include exactly what letters are correct and if letters appear in the correct position, 
it should say what position they are in.  The game should also print out the hidden word at the end when the user quits.
Avoid using Tuples and Lists in the code.

## Additional Requirements

- When generating code, place all the code in a single file and call the file mywordle.py
- When generating tests, place all the code in a single file and call the file test_mywordle.py
- Assume a file "dictionary.txt" exists with all the legal 5 letter words in it.  The file should be in the same directory as the mywordle.py file.

## Tasks

### Software Architect (SA)
Design the software architecture for a command line application that implements the Wordle game. The architecture should include components for user input, game logic, and user feedback. Identify the APIs for each component and how they will interact with each other. Ensure that the design avoids the use of Tuples and Lists.

### Software Developer (SDE)
Implement the code for the command line application based on the architecture provided by the SA. The code should include components for user input, game logic, and user feedback. The game logic should include a dictionary of legal words, a mechanism for picking a random hidden word, and a mechanism for comparing the user's word to the hidden word. The user feedback should include graphical elements to show which letters were in the hidden word or in the correct location.

### Quality Assurance Engineer (QA)
Write test cases for the command line application. The test cases should cover all aspects of the game, including user input, game logic, and user feedback. Ensure that the test cases cover all possible user inputs, including legal and illegal words, and all possible game outcomes, including winning, losing, and quitting the game.
