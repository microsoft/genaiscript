File main.py:
```python
import game_logic
import user_input
import output_display

def main():
    game = game_logic.GameLogic()
    input_handler = user_input.UserInput()
    display = output_display.OutputDisplay()

    while True:
        bet = input_handler.get_bet()
        if input_handler.quit_game():
            display.show_quit_message()
            break

        game.deal_initial_cards()
        display.show_initial_cards(game.player_hand, game.dealer_hand)

        while not game.player_turn_over:
            action = input_handler.get_action()
            game.player_turn(action)
            display.show_turn_result(game.player_hand, game.dealer_hand)

        game.dealer_turn()
        display.show_turn_result(game.player_hand, game.dealer_hand)

        winner = game.calculate_winner()
        display.show_round_result(winner, game.player_money)

        game.reset_round()

if __name__ == "__main__":
    main()
```

File game_logic.py:
```python
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
```

File user_input.py:
```python
class UserInput:
    def get_bet(self):
        while True:
            bet = input("Enter your bet (minimum 10): ")
            if bet.isdigit() and int(bet) >= 10:
                return int(bet)
            else:
                print("Invalid bet. Please enter a number greater than or equal to 10.")

    def get_action(self):
        while True:
            action = input("Enter your action (hit or stand): ").lower()
            if action in ['hit', 'stand']:
                return action
            else:
                print("Invalid action. Please enter 'hit' or 'stand'.")

    def quit_game(self):
        return input("Do you want to quit the game? (yes or no): ").lower() == 'yes'
```

File output_display.py:
```python
class OutputDisplay:
    def show_initial_cards(self, player_hand, dealer_hand):
        print("\nInitial cards:")
        print("Player: ", player_hand)
        print("Dealer: ", dealer_hand[0], "X")

    def show_turn_result(self, player_hand, dealer_hand):
        print("\nCurrent hands:")
        print("Player: ", player_hand)
        print("Dealer: ", dealer_hand)

    def show_round_result(self, winner, player_money):
        print("\nRound result:")
        if winner == 'player':
            print("You won!")
        elif winner == 'dealer':
            print("Dealer won!")
        else:
            print("It's a draw!")
        print("Your current money: ", player_money)

    def show_quit_message(self):
        print("\nThanks for playing! Goodbye!")
```