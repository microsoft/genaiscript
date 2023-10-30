class Player:
    def __init__(self, money: int):
        self.money = money
        self.hand = []

    def bet(self, amount: int):
        self.money -= amount

    def win(self, amount: int):
        self.money += amount

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
