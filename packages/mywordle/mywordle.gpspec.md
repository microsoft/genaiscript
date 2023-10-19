#  MyWordle Application Description

-   [SA-planning](./mywordle1.saplan.gpspec.md)

## Idea
This application implements Wordle as a command line application. The rules follow the rules of the popular game. The game picks a random hidden 5-letter word from a dictionary of legal words. The user provides a 5-letter word and the game shows the user which of the letters in their word is (1) in the hidden word and (2) whether that letter is in the correct position. The user then offers another 5-letter word. 
If the users' word is an illegal word, the game should tell the user it is illegal, give no feedback except to
request another word until they type a legal word.
They have a total of 6 guesses. Illegal guess don't count against their total.
If they guess the hidden word they win. If they lose, the game should show them the hidden word. The game should use graphical elements similar to the Web-based version to show which of their letters was in the hidden word or in the correct location.
After each turn the user feedback should include exactly what letters are correct and if letters appear in the correct position, 
it should say what position they are in.  The game should also print out the hidden word at the end when the user quits.
Avoid using Tuples and Lists in the code.

-   [SA-planning](./mywordle.saplan.gpspec.md)