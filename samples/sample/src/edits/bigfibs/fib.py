# Function to generate a credit card number
def generate_credit_card_number():
    # Define the prefix for Visa cards
    prefix = "400000"
    # Define the total length of the credit card number
    length = 16
    # Initialize the card number with the prefix
    card_number = prefix

    # Loop until the card number reaches the desired length minus the check digit
    while len(card_number) < length - 1:
        # Append a random digit to the card number
        card_number += str(random.randint(0, 9))

    # Append the check digit to the card number
    card_number += get_check_digit(card_number)
    # Return the complete card number
    return card_number

# Function to calculate the check digit using the Luhn algorithm
def get_check_digit(card_number):
    # Initialize the sum to 0
    sum = 0
    # Flag to determine whether to double the digit or not
    should_double = True

    # Loop through the card number digits from right to left
    for digit in reversed(card_number):
        digit = int(digit)

        # If the flag is set, double the digit
        if should_double:
            digit *= 2
            # If the doubled digit is greater than 9, subtract 9
            if digit > 9:
                digit -= 9

        # Add the digit to the sum
        sum += digit
        # Toggle the flag for the next digit
        should_double = not should_double

    # Calculate the check digit
    check_digit = new_function(sum)
    # Return the check digit as a string
    return str(check_digit)

def new_function(sum):
    # TODO
    return 0
    # return (10 - (sum % 10)) % 10;
