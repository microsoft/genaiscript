def validate_input(word: str) -> bool:
    return len(word) == 5 and word.isalpha() and word.islower()
