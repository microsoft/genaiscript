import random

class GameLogic:
    def __init__(self):
        self.deck = self.generate_deck()
        self.player_hand = []
        self.dealer_hand = []
        self.player_money = 100
        self.player_turn_over = False

    def generate_deck(self):
        suits = ['hearts', 'diamonds', 'clubs', 'spades']
        ranks = list(range(2, 11)) + ['J', 'Q', 'K', 'A']
        return [str(rank) + ' of ' + suit for suit in suits for rank in ranks]

    def deal_initial_cards(self):
        self.player_hand = [self.draw_card(), self.draw_card()]
        self.dealer_hand = [self.draw_card(), self.draw_card()]

    def draw_card(self):
        return self.deck.pop(random.randint(0, len(self.deck) - 1))

    def player_turn(self, action):
        if action == 'hit':
            self.player_hand.append(self.draw_card())
            if self.calculate_hand_value(self.player_hand) > 21:
                self.player_turn_over = True
        elif action == 'stand':
            self.player_turn_over = True

    def dealer_turn(self):
        while self.calculate_hand_value(self.dealer_hand) < 17:
            self.dealer_hand.append(self.draw_card())

    def calculate_hand_value(self, hand):
        value = 0
        aces = 0
        for card in hand:
            rank = card.split()[0]
            if rank.isdigit():
                value += int(rank)
            elif rank in ['J', 'Q', 'K']:
                value += 10
            else:
                aces += 1

        for _ in range(aces):
            if value + 11 <= 21:
                value += 11
            else:
                value += 1

        return value

    def calculate_winner(self):
        player_value = self.calculate_hand_value(self.player_hand)
        dealer_value = self.calculate_hand_value(self.dealer_hand)

        if player_value > 21:
            return 'dealer'
        elif dealer_value > 21:
            self.player_money += 10
            return 'player'
        elif player_value > dealer_value:
            self.player_money += 10
            return 'player'
        elif dealer_value > player_value:
            self.player_money -= 10
            return 'dealer'
        else:
            return 'draw'

    def reset_round(self):
        self.deck = self.generate_deck()
        self.player_hand = []
        self.dealer_hand = []
        self.player_turn_over = False
