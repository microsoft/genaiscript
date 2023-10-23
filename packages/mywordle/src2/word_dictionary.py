import random

class WordDictionary:
    def __init__(self):
        with open("dictionary.txt", "r") as f:
            self.words = [word.strip() for word in f.readlines() if len(word.strip()) == 5]

    def get_random_word(self):
        return random.choice(self.words)

    def is_legal_word(self, word):
        return word in self.words
    
