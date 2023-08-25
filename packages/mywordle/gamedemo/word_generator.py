import random

def generate_word() -> str:
    with open("dictionary.txt", "r") as file:
        words = [word.strip() for word in file.readlines() if len(word.strip()) == 5]
    return random.choice(words)
