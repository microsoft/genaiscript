class Dealer:
    def __init__(self):
        self.hand = []

    def hand_value(self):
        value = 0
        aces = 0
        for card in self.hand:
            if card == "ace":
                aces += 1
                value += 1
            elif card in ["king", "queen", "jack"]:
                value += 10
            else:
                value += card

        while value <= 11 and aces > 0:
            value += 10
            aces -= 1

        return value

    def should_draw(self):
        return self.hand_value() < 17
