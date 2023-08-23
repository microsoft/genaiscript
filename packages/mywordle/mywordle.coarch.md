# Create a command-line version of the popular Wordle application

## Idea
This application implements Wordle as a command line application. The rules follow the rules of the popular game. The game picks a random hidden 5-letter word from a dictionary of legal words. The user provides a 5-letter word and the game shows the user which of the letters in their word is (1) in the hidden word and (2) whether that letter is in the correct position. The user then offers another 5-letter word. 
If the users' word is an illegal word, the game should tell the user it is illegal, give no feedback except to
request another word until they type a legal word.
They have a total of 6 guesses. Illegal guess don't count against their total.
If they guess the hidden word they win. If they lose, the game should show them the hidden word. The game should use graphical elements similar to the Web-based version to show which of their letters was in the hidden word or in the correct location.
After each turn the user feedback should include exactly what letters are correct and if letters appear in the correct position, 
it should say what position they are in.  The game should also print out the hidden word at the end when the user quits.

-   [SA-planning](./mywordle.saplan.coarch.md)


## Instructions for Software Architect (SA)
1. Design a modular architecture for the command-line Wordle application.
2. Define APIs for communication between components, such as user input, game logic, and display.
3. Identify data structures for storing the dictionary of legal words, user guesses, and game state.
4. Assume the file dictionary.txt already exists in the current folder 
that contains the legal 5-letter words used in the game.

## Instructions for Software Developer (SDE)
1. Implement the game logic, including random word selection, user input validation, and guess evaluation.
2. Create a user interface for the command-line application, ensuring it provides clear feedback on correct letters and their positions.
3. Integrate the components designed by the Software Architect, ensuring smooth interaction between them.

## Instructions for Quality Assurance Engineer (QA)
1. Develop test cases to validate the functionality of the command-line Wordle application, including legal and illegal word inputs, correct and incorrect guesses, and win/lose scenarios.
2. Test the user interface for clarity and ease of use, ensuring it provides accurate feedback on correct letters and their positions.
3. Collaborate with the Software Developer to address any issues found during testing and ensure a high-quality final product.

