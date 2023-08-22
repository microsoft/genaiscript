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
