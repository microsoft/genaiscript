# MyWordle Software Architecture Plan

## Programming Language and Framework
The product will be implemented in Python, a powerful and flexible programming language that is well-suited for this type of application. No specific framework will be used as the application is simple enough to be implemented using standard Python libraries.

## Instructions for the Software Developer
The software developer should implement the code for the command line application based on the architecture provided in this document. The code should include components for user input, game logic, and user feedback. The game logic should include a dictionary of legal words, a mechanism for picking a random hidden word, and a mechanism for comparing the user's word to the hidden word. The user feedback should include graphical elements to show which letters were in the hidden word or in the correct location.

## Invariants
- The hidden word is always a 5-letter word from the dictionary of legal words.
- The user always provides a 5-letter word as input.
- The user has a total of 6 guesses.

## Components

### User Input Component
This component is responsible for receiving and validating the user's input. It should ensure that the input is a 5-letter word and that it is a legal word from the dictionary.

API:
- `get_input()`: Returns the user's input as a string.

### Game Logic Component
This component is responsible for the game logic. It should include a dictionary of legal words, a mechanism for picking a random hidden word, and a mechanism for comparing the user's word to the hidden word.

API:
- `pick_word()`: Returns a random 5-letter word from the dictionary.
- `compare_words(user_word, hidden_word)`: Returns a feedback string showing which letters were in the hidden word or in the correct location.

### User Feedback Component
This component is responsible for providing feedback to the user. It should include graphical elements to show which letters were in the hidden word or in the correct location.

API:
- `show_feedback(feedback)`: Prints the feedback string to the console.

## Interconnections
The command line client will use the User Input Component to get the user's input, the Game Logic Component to pick a hidden word and compare it to the user's word, and the User Feedback Component to show the feedback to the user.

## Command Line Client
The command line client should be easy to use and well documented. It should use the APIs of the components to implement the game.

API:
- `start_game()`: Starts a new game.
- `guess_word()`: Prompts the user to guess a word and provides feedback.
- `end_game()`: Ends the game and shows the hidden word.

