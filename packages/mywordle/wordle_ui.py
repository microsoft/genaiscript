import wordle_game

class WordleUI:
    def __init__(self, game: wordle_game.WordleGame):
        self.game = game

    def start(self):
        self.game.start()
        attempts = 0
        won = False

        while attempts < 6:
            self.display_unused_letters()
            guess = input("Enter your guess: ").strip().lower()
            if not self.game.is_legal_word(guess):
                print("Illegal word. Please enter a 5-letter word.")
                continue

            correct, feedback = self.game.guess_word(guess)
            self.display_feedback(feedback)

            if correct:
                won = True
                break

            attempts += 1

        self.display_result(won, self.game.get_hidden_word())

    def display_feedback(self, feedback: str):
        print("Feedback:", feedback)

    def display_unused_letters(self):
        unused_letters = self.game.get_unused_letters()
        print("Unused letters:", unused_letters)

    def display_result(self, won: bool, hidden_word: str):
        if won:
            print("Congratulations! You guessed the word:", hidden_word)
        else:
            print("Sorry, you didn't guess the word. The correct word was:", hidden_word)
