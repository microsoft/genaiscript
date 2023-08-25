from word_generator import generate_word
from input_validator import validate_input
from game_logic import compare_words
from user_feedback import display_feedback

def main():
    hidden_word = generate_word()
    guesses = 0
    guessed_letters = set()

    while guesses < 6:
        user_word = input("Enter a 5-letter word: ").lower()

        if not validate_input(user_word):
            print("Invalid input. Please enter a legal 5-letter word.")
            continue

        guessed_letters.update(set(user_word))
        remaining_letters = "".join(sorted(set("abcdefghijklmnopqrstuvwxyz") - guessed_letters))

        correct_positions, correct_letters = compare_words(user_word, hidden_word)

        if correct_positions == [(i, hidden_word[i]) for i in range(5)]:
            print("Congratulations! You guessed the hidden word!")
            break

        display_feedback(correct_positions, correct_letters, remaining_letters, hidden_word)
        guesses += 1

    if guesses == 6:
        print(f"You've reached the maximum number of guesses. The hidden word was {hidden_word}.")

if __name__ == "__main__":
    main()