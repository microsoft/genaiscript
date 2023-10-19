# MyWordle Software Architecture Plan Document

-   [./bugnotes.md](./bugnotes.md)
-   [src/main.py](./src/main.py)
-   [src/wordle_game.py](./src/wordle_game.py)
-   [src/word_dictionary.py](./src/word_dictionary.py)
-   [src/utils.py](./src/utils.py)
-   [src/README.md](./src/README.md)

## Product Idea and Description

This application implements Wordle as a command line application. The rules follow the rules of the popular game. The game picks a random hidden 5-letter word from a dictionary of legal words. The user provides a 5-letter word and the game shows the user which of the letters in their word is (1) in the hidden word and (2) whether that letter is in the correct position. The user then offers another 5-letter word. If the users' word is an illegal word, the game should tell the user it is illegal, give no feedback except to request another word until they type a legal word. They have a total of 6 guesses. Illegal guess don't count against their total. If they guess the hidden word they win. If they lose, the game should show them the hidden word. The game should use graphical elements similar to the Web-based version to show which of their letters was in the hidden word or in the correct location. After each turn the user feedback should include exactly what letters are correct and if letters appear in the correct position, it should say what position they are in. The game should also print out the hidden word at the end when the user quits. Avoid using Tuples and Lists in the code.
This application implements Wordle as a command line application. The rules follow the rules of the popular game. The game picks a random hidden 5-letter word from a dictionary of legal words. The user provides a 5-letter word and the game shows the user which of the letters in their word is (1) in the hidden word and (2) whether that letter is in the correct position. The user then offers another 5-letter word. 
If the users' word is an illegal word, the game should tell the user it is illegal, give no feedback except to
request another word until they type a legal word.
They have a total of 6 guesses. Illegal guess don't count against their total.
If they guess the hidden word they win. If they lose, the game should show them the hidden word. The game should use graphical elements similar to the Web-based version to show which of their letters was in the hidden word or in the correct location.
After each turn the user feedback should include exactly what letters are correct and if letters appear in the correct position, 
it should say what position they are in.  The game should also print out the hidden word at the end when the user quits.
Avoid using Tuples and Lists in the code.

## Directions for the Software Developer

- Implement the product as a command line application
- Choose a programming language and a framework
- Show the directory structure for the code using bullet points in markdown
- Include the instructions for the software developer from SUMMARY in your output
- Make suggestions for invariants that are related to the application domain
- Describe each component in the implementation and assume it will be encapsulate in a single file
- Define a command line client that will use the product that can be used both for testing and for demonstration purposes

## Programming Language and Framework

- Language: Python
- Framework: None

## Directory Structure

- wordle/
  - main.py
  - wordle_game.py
  - word_dictionary.py
  - utils.py
  - README.md

## Invariants

- The hidden word must be a 5-letter word from the dictionary of legal words
- The user's guess must be a 5-letter word
- The user has a maximum of 6 valid guesses

## Components

### main.py

- Imports: `wordle_game`
- Exports: None
- API: None
- Description: This file will be the entry point for the command line application. It will create an instance of the WordleGame class and start the game.

### wordle_game.py

- Imports: `word_dictionary`, `utils`
- Exports: `WordleGame`
- API:
  - `WordleGame` class
    - `__init__(self)`: Initializes the game state
    - `start(self)`: Starts the game loop
    - `guess(self, word)`: Processes a user's guess and returns feedback
    - `is_game_over(self)`: Checks if the game is over
- Description: This file will contain the main game logic, including the game loop, processing user input, and providing feedback.

### word_dictionary.py

- Imports: None
- Exports: `WordDictionary`
- API:
  - `WordDictionary` class
    - `__init__(self)`: Initializes the dictionary
    - `get_random_word(self)`: Returns a random 5-letter word from the dictionary file dictionary.txt
    - `is_legal_word(self, word)`: Checks if a word is a legal 5-letter word
- Description: This file will contain the dictionary of legal words and methods to interact with it.

### utils.py

- Imports: None
- Exports: `compare_words`, `print_feedback`
- API:
  - `compare_words(word1, word2)`: Compares two words and returns a tuple with the number of correct letters and the number of correct positions
  - `print_feedback(feedback)`: Prints the feedback in a graphical format
- Description: This file will contain utility functions for comparing words and printing feedback.

### README.md

- Description: This file will contain instructions on how to use the command line application, including installation, usage, and examples.

## Command Line Client

The command line client will be implemented in `main.py`. It will use the `WordleGame` class to run the game and interact with the user. The client will be easy to use and well documented in the `README.md` file.