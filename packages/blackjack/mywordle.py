import random
import itertools
import string

class UserInputComponent:
    def __init__(self):
        with open('dictionary.txt', 'r') as f:
            self.legal_words = [word.strip() for word in f.readlines()]

    def get_input(self):
        while True:
            user_word = input("Enter a 5-letter word: ")
            if len(user_word) != 5 or user_word not in self.legal_words:
                print("Illegal word. Please enter a legal 5-letter word.")
            else:
                return user_word


class GameLogicComponent:
    def __init__(self, legal_words):
        self.legal_words = legal_words

    def pick_word(self):
        return random.choice(self.legal_words)

    def compare_words(self, user_word, hidden_word):
        feedback = ""
        for i in range(5):
            if user_word[i] == hidden_word[i]:
                feedback += "[{}]".format(user_word[i])
            elif user_word[i] in hidden_word:
                feedback += "({})".format(user_word[i])
            else:
                feedback += user_word[i]
        return feedback


class UserFeedbackComponent:
    @staticmethod
    def show_feedback(feedback):
        print(feedback)


class CommandLineClient:
    def __init__(self):
        self.user_input_component = UserInputComponent()
        self.game_logic_component = GameLogicComponent(self.user_input_component.legal_words)
        self.user_feedback_component = UserFeedbackComponent()

    def start_game(self):
        self.hidden_word = self.game_logic_component.pick_word()
        self.guesses = 0

    def guess_word(self):
        user_word = self.user_input_component.get_input()
        feedback = self.game_logic_component.compare_words(user_word, self.hidden_word)
        self.user_feedback_component.show_feedback(feedback)
        self.guesses += 1
        if user_word == self.hidden_word:
            print("Congratulations! You've guessed the hidden word.")
            return True
        elif self.guesses == 6:
            print("Sorry, you've run out of guesses. The hidden word was {}.".format(self.hidden_word))
            return True
        else:
            return False

    def end_game(self):
        print("Thank you for playing. The hidden word was {}.".format(self.hidden_word))

    def run(self):
        self.start_game()
        while not self.guess_word():
            pass
        self.end_game()


if __name__ == "__main__":
    client = CommandLineClient()
    client.run()
if __name__ == "__main__":
    client = CommandLineClient()
    client.run()
