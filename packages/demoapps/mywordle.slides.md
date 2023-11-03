### MyWordle Application

- Implements Wordle as a command line application
- Picks a random hidden 5-letter word from a dictionary of legal words
- User provides a 5-letter word and the game shows which of the letters in their word is in the hidden word and whether that letter is in the correct position

---

### Additional Requirements

- All code in a single file: mywordle.py
- All tests in a single file: test_mywordle.py
- Assume a file "dictionary.txt" exists with all the legal 5-letter words in it

---

### Tasks

- Software Architect: Design the software architecture
- Software Developer: Implement the code for the command line application
- Quality Assurance Engineer: Write test cases for the command line application

---

### MyWordle Software Architecture Plan

- Implemented in Python
- No specific framework will be used
- Components for user input, game logic, and user feedback

---

### User Input Component

- Responsible for receiving and validating the user's input
- Ensures that the input is a 5-letter word and that it is a legal word from the dictionary

---

### Game Logic Component

- Responsible for the game logic
- Includes a dictionary of legal words, a mechanism for picking a random hidden word, and a mechanism for comparing the user's word to the hidden word

---

### User Feedback Component

- Responsible for providing feedback to the user
- Includes graphical elements to show which letters were in the hidden word or in the correct location

---

### Command Line Client

- Uses the User Input Component to get the user's input
- Uses the Game Logic Component to pick a hidden word and compare it to the user's word
- Uses the User Feedback Component to show the feedback to the user

---

### mywordle.py Code Snippet

```python
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
```

---

### mywordle.py Code Snippet

```python
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
```

---

### mywordle.py Code Snippet

```python
class UserFeedbackComponent:
    @staticmethod
    def show_feedback(feedback):
        print(feedback)
```

---

### mywordle.py Code Snippet

```python
class CommandLineClient:
    def __init__(self):
        self.user_input_component = UserInputComponent()
        self.game_logic_component = GameLogicComponent(self.user_input_component.legal_words)
        self.user_feedback_component = UserFeedbackComponent()

    def start_game(self):
        self.hidden_word = self.game_logic_component.pick_word()
        self.guesses = 0
```

---

### test_mywordle.py Code Snippet

```python
class TestMyWordle(unittest.TestCase):
    def setUp(self):
        self.client = CommandLineClient()

    @patch('builtins.input
