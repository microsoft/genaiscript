# MyWordle architecture description

-   [./mywordle.coarch.md](./mywordle.coarch.md)
-   [./bugnotes.md](./bugnotes.md)
-   [src/main.py](./src/main.py)
-   [src/wordle_game.py](./src/wordle_game.py)
-   [src/word_dictionary.py](./src/word_dictionary.py)
-   [src/user_interface.py](./src/user_interface.py)
-   [SDE-coding](./mywordle.saplan.py)

## Product Idea

This application implements Wordle as a command line application. The rules follow the rules of the popular game. The game picks a random hidden 5-letter word from a dictionary of legal words. The user provides a 5-letter word and the game shows the user which of the letters in their word is (1) in the hidden word and (2) whether that letter is in the correct position. The user then offers another 5-letter word. If the users' word is an illegal word, the game should tell the user it is illegal, give no feedback except to request another word until they type a legal word. They have a total of 6 guesses. Illegal guess don't count against their total. If they guess the hidden word they win. If they lose, the game should show them the hidden word. The game should use graphical elements similar to the Web-based version to show which of their letters was in the hidden word or in the correct location. After each turn the user feedback should include exactly what letters are correct and if letters appear in the correct position, it should say what position they are in. The game should also print out the hidden word at the end when the user quits.

## Directions for the Software Developer

Use the SUMMARY as input and generate the architecture for the product. Encapsulate each component in a separate module and define the APIs for each component. Make sure that the components are loosely coupled, they can be easily tested and that the APIs are well defined. Don't write the code yourself but provide a clear and complete explanation of what each component should do and what the API is that a software developer can implement the code for each component and that a quality assurance engineer can write test cases from your descriptions.

## Programming Language and Framework

We will use Python as the programming language and no specific framework is required for this command line application.

## Directory Structure

- wordle/
  - main.py
  - wordle_game.py
  - word_dictionary.py
  - user_interface.py

## Invariants

1. The hidden word should always be a 5-letter legal word.
2. The user's guess should be a 5-letter word.
3. The user has a maximum of 6 legal guesses.

## Components

### main.py

This is the entry point of the application. It imports the `WordleGame` class from `wordle_game.py` and the `UserInterface` class from `user_interface.py`. It initializes the game and user interface instances and starts the game loop.

### wordle_game.py

This file contains the `WordleGame` class, which handles the game logic. It imports the `WordDictionary` class from `word_dictionary.py`.

**API:**

- `__init__(self)`: Initializes the game state, including the hidden word and the number of guesses.
- `guess_word(self, word: str) -> Tuple[str, List[Tuple[int, str]]]`: Takes the user's guess and returns the result of the guess, including the correct letters and their positions.
- `is_legal_word(self, word: str) -> bool`: Checks if the given word is a legal word.
- `is_game_over(self) -> bool`: Checks if the game is over (either the user has won or has used all their guesses).
- `get_hidden_word(self) -> str`: Returns the hidden word.

### word_dictionary.py

This file contains the `WordDictionary` class, which manages the dictionary of legal words.

**API:**

- `__init__(self)`: Initializes the dictionary by loading the legal words from a file.
- `get_random_word(self) -> str`: Returns a random 5-letter legal word.
- `is_legal_word(self, word: str) -> bool`: Checks if the given word is a legal word.

### user_interface.py

This file contains the `UserInterface` class, which handles user input and output.

**API:**

- `get_user_guess(self) -> str`: Gets the user's guess from the command line.
- `display_guess_result(self, result: Tuple[str, List[Tuple[int, str]]])`: Displays the result of the user's guess.
- `display_game_over(self, hidden_word: str, has_won: bool)`: Displays the game over message, including the hidden word and whether the user has won or lost.

## Command Line Client

The command line client will be the `main.py` file. To start the game, the user can run `python main.py` from the command line. The user interface will guide the user through the game, including inputting their guesses and displaying the results.

### updates.md

Report a summary of changes made to the files in this file.