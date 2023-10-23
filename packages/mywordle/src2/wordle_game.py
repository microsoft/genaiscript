import random
from word_dictionary import WordDictionary
from utils import compare_words

class WordleGame:
    def __init__(self):
        self.word_dictionary = WordDictionary()
        self.hidden_word = self.word_dictionary.get_random_word()
        self.guesses_remaining = 6
        self.used_letters = set()

    def start(self):
        print("Welcome to MyWordle! You have 6 guesses to find the hidden 5-letter word.")

    def guess(self, word):
        if not self.word_dictionary.is_legal_word(word):
            return None

        self.used_letters.update(set(word))
        feedback = compare_words(self.hidden_word, word)
        self.guesses_remaining -= 1

        return feedback

    def is_game_over(self):
        return self.guesses_remaining == 0 or self.has_won()

    def has_won(self):
        return self.hidden_word in self.used_letters

    def get_hidden_word(self):
        return self.hidden_word

    def get_unused_letters(self):
        return set("abcdefghijklmnopqrstuvwxyz") - self.used_letters
