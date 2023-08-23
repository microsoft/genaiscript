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

