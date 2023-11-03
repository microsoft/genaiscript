### Introduction
- This slidedeck provides an overview of the Python script `mywordle.py`.

---

### UserInputComponent Class
- Handles user input.
- Reads a dictionary file to get legal words.

```python
class UserInputComponent:
    def __init__(self):
        with open('dictionary.txt', 'r') as f:
            self.legal_words = [word.strip() for word in f.readlines()]

    def get_input(self):
        ...
```

---

### GameLogicComponent Class
- Handles game logic.
- Picks a random word and compares it with the user's word.

```python
class GameLogicComponent:
    def __init__(self, legal_words):
        self.legal_words = legal_words

    def pick_word(self):
        ...

    def compare_words(self, user_word, hidden_word):
        ...
```

---

### UserFeedbackComponent Class
- Provides feedback to the user.

```python
class UserFeedbackComponent:
    @staticmethod
    def show_feedback(feedback):
        print(feedback)
```

---

### CommandLineClient Class
- Orchestrates the game flow.
- Initializes other components and controls the game loop.

```python
class CommandLineClient:
    def __init__(self):
        ...

    def start_game(self):
        ...

    def guess_word(self):
        ...

    def end_game(self):
        ...

    def run(self):
        ...
```

---

### Main Execution
- The game is started by creating an instance of CommandLineClient and running it.

```python
if __name__ == "__main__":
    client = CommandLineClient()
    client.run()
```
