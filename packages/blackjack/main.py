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
