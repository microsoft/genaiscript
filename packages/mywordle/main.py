import wordle_game
import wordle_ui

def main():
    # Load the dictionary of legal words from a file
    dictionary = wordle_game.WordleGame.load_dictionary("dictionary.txt")

    # Initialize the game with a dictionary of legal words
    game = wordle_game.WordleGame(dictionary)

    # Initialize the UI with a reference to the game instance
    ui = wordle_ui.WordleUI(game)

    # Start the game loop, handling user input and displaying game feedback
    ui.start()

if __name__ == "__main__":
    main()
