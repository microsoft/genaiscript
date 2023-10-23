import sys
from wordle_game import WordleGame
from utils import print_feedback, print_remaining_letters

def main():
    game = WordleGame()
    game.start()

    while not game.is_game_over():
        user_input = input("Enter a 5-letter word: ").strip().lower()

        if len(user_input) != 5:
            print("Invalid input. Please enter a 5-letter word.")
            continue

        feedback = game.guess(user_input)
        if feedback is not None:
            print_feedback(feedback, user_input, game.get_hidden_word())
            print_remaining_letters(game)
            print(f"Guesses remaining: {game.guesses_remaining}")
        else:
            print("Illegal word. Please enter a valid 5-letter word.")

    if game.has_won():
        print("Congratulations! You guessed the hidden word.")
    else:
        print(f"Sorry, you didn't guess the hidden word. It was {game.get_hidden_word()}.")

if __name__ == "__main__":
    main()
