# MyWordle architecture plan

Linked files:
-   [Base](./mywordle.coarch.md)
-   [PM-planning](./mywordle.pm.coarch.md)
-   [SDE-coding](./mywordle.pm.saplan.py)
-   [dev](./bugnotes.md)

## Product Idea

MyWordle is a command-line application where users guess a secret word by inputting their guesses. The application provides feedback on the correctness of guessed letters and their positions. The game also displays letters that have not been guessed yet and uses a graphical display to show the user's progress.




## Directions for Software Developer

- Implement code for components based on the software architect's architecture and APIs.
- Ensure proper handling of user input and game logic.

## Programming Language and Framework

- Language: Python
- Framework: None (command-line application)

## Directory Structure

- mywordle/
  - main.py
  - word_generator.py
  - input_validator.py
  - game_logic.py
  - user_interface.py

## Invariants

- The secret word must be a valid English word.
- The user's guess must be a valid English word of the same length as the secret word.
- The user cannot input the same guess twice.

## Component Descriptions

### main.py

- Imports: `word_generator`, `input_validator`, `game_logic`, `user_interface`
- Exports: None
- API: None
- Description: Main entry point for the MyWordle application. Initializes the game, handles user input, and coordinates the interaction between components.

### word_generator.py

- Imports: None
- Exports: `generate_secret_word`
- API:
  - `generate_secret_word() -> str`: Generates a random 5-letter secret word randomly selected from a dictionary file.
- Description: Responsible for generating the secret word for the game.

### input_validator.py

- Imports: None
- Exports: `validate_user_input`
- API:
  - `validate_user_input(user_input: str, secret_word: str) -> bool`: Validates the user's input against the secret word's length and checks if it's a valid English word by looking it up in the dictionary file.
- Description: Validates user input to ensure it meets the game's requirements. 


### game_logic.py

- Imports: None
- Exports: `evaluate_guess`
- API:
  - `evaluate_guess(user_input: str, secret_word: str) -> Tuple[int, int]`: Compares the user's guess to the secret word and returns the number of correct letters and the number of correct letters in the correct position.
- Description: Implements the game logic for evaluating user guesses.

### user_interface.py

- Imports: None
- Exports: `display_game_state`, `display_guess_result`
- API:
  - `display_game_state(unguessed_letters: Set[str], guess_history: List[str]) -> None`: Displays the current game state, including unguessed letters and the user's guess history.
  - `display_guess_result(correct_letters: int, correct_positions: int) -> None`: Displays the result of the user's guess, including the number of correct letters and the number of correct letters in the correct position.
- Description: Handles the user interface for the MyWordle application, including displaying game state and guess results.

## Command Line Client

The command-line client will be implemented in `main.py`. It will use the APIs provided by the other components to initialize the game, handle user input, and display game state and guess results. The client will be well-documented with clear instructions on how to use it, including installation, usage, and troubleshooting.

### Update notes updates.md

This file should contain a summary of the changes made to the code based on the current update. It should be updated every time the code is updated.
