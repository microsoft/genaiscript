import game
import player
import dealer

def display_hand(hand):
    return ', '.join(str(card).capitalize() for card in hand)

def main():
    p = player.Player(100)
    d = dealer.Dealer()
    g = game.Game(p, d)

    while True:
        print(f"Player money: {p.money}")
        bet = int(input("Enter bet amount: "))
        g.place_bet(bet)
        g.deal()

        print(f"Player hand: {display_hand(p.hand)}")
        print(f"Dealer visible card: {display_hand(d.hand[:1])}")

        if g.player_turn():
            print(f"Player final hand: {display_hand(p.hand)}")
            g.dealer_turn()
            print(f"Dealer final hand: {display_hand(d.hand)}")
            winner = g.determine_winner()
            if winner == "player":
                print("Player wins!")
                p.win(g.bet_amount * 2)
            elif winner == "dealer":
                print("Dealer wins!")
            else:
                print("It's a tie!")
                p.win(g.bet_amount)

        else:
            print("Player busts! Dealer wins!")

        g.reset()

        if input("Enter 'q' to quit or any other key to continue: ").lower() == 'q':
            break

if __name__ == "__main__":
    main()
