import random

class Deck:
    def __init__(self):
        self.cards = [i for i in range(1, 14)] * 4
        self.shuffle()

    def shuffle(self):
        random.shuffle(self.cards)

    def draw(self):
        card = self.cards.pop()
        if card == 1:
            return "ace"
        elif card == 11:
            return "jack"
        elif card == 12:
            return "queen"
        elif card == 13:
            return "king"
        else:
            return card
