def compare_words(word1, word2):
    correct_letters = sum(1 for a, b in zip(word1, word2) if a == b)
    correct_positions = sum(1 for a, b in zip(word1, word2) if a != b and a in word2)
    return correct_letters, correct_positions

def print_feedback(feedback, user_input, hidden_word):
    correct_letters, correct_positions = feedback
    result = []
    for a, b in zip(user_input, hidden_word):
        if a == b:
            result.append(a)
        elif a in hidden_word:
            result.append('*')
        else:
            result.append('_')
    print("".join(result))
    print(f"Correct letters: {correct_letters}, Correct positions: {correct_positions}")

def print_remaining_letters(game):
    unused_letters = game.get_unused_letters()
    print(f"Unused letters: {''.join(sorted(unused_letters))}")
