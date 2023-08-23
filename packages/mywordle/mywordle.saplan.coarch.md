# Command-line Wordle Application

-   [SDE-coding](./mywordle.saplan.py)


## Product Idea
This application implements Wordle as a command line application. The rules follow the rules of the popular game. The game picks a random hidden 5-letter word from a dictionary of legal words. The user provides a 5-letter word and the game shows the user which of the letters in their word is (1) in the hidden word and (2) whether that letter is in the correct position. The user then offers another 5-letter word. 
If the users' word is an illegal word, the game should tell the user it is illegal, give no feedback except to
request another word until they type a legal word.
They have a total of 6 guesses. Illegal guess don't count against their total.
If they guess the hidden word they win. If they lose, the game should show them the hidden word. The game should use graphical elements similar to the Web-based version to show which of their letters was in the hidden word or in the correct location.
After each turn the user feedback should include exactly what letters are correct and if letters appear in the correct position, 
it should say what position they are in.  The game should also print out the hidden word at the end when the user quits.
Before each guess, the interface should also display a list of letters that the user has not yet chosen
in any of the words they have guess to help them know what other letters to guess.

## Directions for Software Developer
1. Implement the game logic, including random word selection, user input validation, and guess evaluation.
2. Create a user interface for the command-line application, ensuring it provides clear feedback on correct letters and their positions.
3. Integrate the components designed by the Software Architect, ensuring smooth interaction between them.
4. Do not generate the dictionary.txt file.  It will be provided for you.

## Language and Framework
- Language: Python
- Framework: None (command-line application)

## Directory Structure
- wordle/
  - main.py
  - wordle_game.py
  - wordle_ui.py


## Invariants
- The hidden word must be a legal 5-letter word.
- The user's guess must be a legal 5-letter word.
- The user has a maximum of 6 legal guesses.

## Components

### main.py
- Imports: `wordle_game`, `wordle_ui`
- Exports: None
- API: None
- Description: Main entry point for the command-line application. Initializes the game and UI components, and starts the game loop.
- Prints the set of letters the user has not yet used in any guess before each turn

### wordle_game.py
- Imports: None
- Exports: `WordleGame`
- API:
  - `WordleGame.load_dictionary(file_path: str) -> List[str]`: Load the dictionary of legal words from a file.
  - `WordleGame.__init__(dictionary: List[str])`: Initialize the game with a dictionary of legal words.
  - `WordleGame.start()`: Start a new game by selecting a random hidden word.
  - `WordleGame.guess_word(word: str) -> Tuple[bool, str]`: Process a user's guess and return a tuple containing a boolean indicating if the guess is correct and a string with feedback on correct letters and their positions.
  Update the list of unused letters to not include letters in the current guess.
  - `WordleGame.is_legal_word(word: str) -> bool`: Check if a word is legal according to the dictionary.
  - `WordleGame.get_hidden_word() -> str`: Return the hidden word.
- Description: Implements the game logic, including random word selection, user input validation, and guess evaluation.

### wordle_ui.py
- Imports: None
- Exports: `WordleUI`
- API:
  - `WordleUI.__init__(game: WordleGame)`: Initialize the UI with a reference to the game instance.
  - `WordleUI.start()`: Start the game loop, handling user input and displaying game feedback.
  - `WordleUI.display_feedback(feedback: str)`: Display feedback on correct letters and their positions.
  - `WordleUI.display_unused_letters(feedback: str)`: Display the letters that have not yet been guessed in any words.
  - `WordleUI.display_result(won: bool, hidden_word: str)`: Display the game result (win/lose) and the hidden word.
- Description: Creates a user interface for the command-line application, ensuring it provides clear feedback on correct letters and their positions. Integrates with the `WordleGame` component to process user input and display game feedback.