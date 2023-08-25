from typing import List, Tuple

def compare_words(user_word: str, hidden_word: str) -> Tuple[List[Tuple[int, str]], List[str]]:
    correct_positions = [(i, user_word[i]) for i in range(5) if user_word[i] == hidden_word[i]]
    correct_letters = [user_word[i] for i in range(5) if user_word[i] in hidden_word and (i, user_word[i]) not in correct_positions]
    return correct_positions, correct_letters