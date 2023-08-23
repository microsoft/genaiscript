File main.py:
```python
import wordle_game
import wordle_ui

def main():
    # Load the dictionary of legal words from a file
    dictionary = wordle_game.WordleGame.load_dictionary("dictionary.txt")

    # Initialize the game with a dictionary of legal words
    game = wordle_game.WordleGame(dictionary)

    # Initialize the UI with a reference to the game instance
    ui = wordle_ui.WordleUI(game)

    # Start the game loop, handling user input and displaying game feedback
    ui.start()

if __name__ == "__main__":
    main()
```

File wordle_game.py:
```python
import random
from typing import List, Tuple

class WordleGame:
    def __init__(self, dictionary: List[str]):
        self.dictionary = dictionary
        self.hidden_word = ""
        self.unused_letters = "abcdefghijklmnopqrstuvwxyz"

    @staticmethod
    def load_dictionary(file_path: str) -> List[str]:
        with open(file_path, "r") as file:
            return [word.strip() for word in file.readlines()]

    def start(self):
        self.hidden_word = random.choice(self.dictionary)

    def guess_word(self, word: str) -> Tuple[bool, str]:
        if not self.is_legal_word(word):
            return False, "Illegal word"

        correct = self.hidden_word == word
        feedback = self._generate_feedback(word)
        self._update_unused_letters(word)
        return correct, feedback

    def is_legal_word(self, word: str) -> bool:
        return word in self.dictionary

    def get_hidden_word(self) -> str:
        return self.hidden_word

    def get_unused_letters(self) -> str:
        return self.unused_letters

    def _generate_feedback(self, word: str) -> str:
        feedback = ""
        for i, letter in enumerate(word):
            if letter == self.hidden_word[i]:
                feedback += "█"
            elif letter in self.hidden_word:
                feedback += "▒"
            else:
                feedback += "░"
        return feedback

    def _update_unused_letters(self, word: str):
        self.unused_letters = "".join([letter for letter in self.unused_letters if letter not in word])

```

File wordle_ui.py:
```python
import wordle_game

class WordleUI:
    def __init__(self, game: wordle_game.WordleGame):
        self.game = game

    def start(self):
        self.game.start()
        attempts = 0
        won = False

        while attempts < 6:
            self.display_unused_letters()
            guess = input("Enter your guess: ").strip().lower()
            if not self.game.is_legal_word(guess):
                print("Illegal word. Please enter a 5-letter word.")
                continue

            correct, feedback = self.game.guess_word(guess)
            self.display_feedback(feedback)

            if correct:
                won = True
                break

            attempts += 1

        self.display_result(won, self.game.get_hidden_word())

    def display_feedback(self, feedback: str):
        print("Feedback:", feedback)

    def display_unused_letters(self):
        unused_letters = self.game.get_unused_letters()
        print("Unused letters:", unused_letters)

    def display_result(self, won: bool, hidden_word: str):
        if won:
            print("Congratulations! You guessed the word:", hidden_word)
        else:
            print("Sorry, you didn't guess the word. The correct word was:", hidden_word)
```