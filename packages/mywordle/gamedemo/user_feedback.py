from typing import List, Tuple

def display_feedback(correct_positions: List[Tuple[int, str]], correct_letters: List[str], remaining_letters: str, hidden_word: str):
    feedback = "".join([letter if (i, letter) in correct_positions else ":" if letter in correct_letters else "_" for i, letter in enumerate(hidden_word)])
    print(f"Feedback: {feedback}")
    print(f"Remaining letters: {remaining_letters}")