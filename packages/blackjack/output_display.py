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
