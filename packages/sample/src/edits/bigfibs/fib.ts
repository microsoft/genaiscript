// Function to generate a credit card number
function generateCreditCardNumber(): string {
    // Define the prefix for Visa cards
    const prefix = "400000"
    // Define the total length of the credit card number
    const length = 16
    // Initialize the card number with the prefix
    let cardNumber = prefix

    // Loop until the card number reaches the desired length minus the check digit
    while (cardNumber.length < length - 1) {
        // Append a random digit to the card number
        cardNumber += Math.floor(Math.random() * 10).toString()
    }

    // Append the check digit to the card number
    cardNumber += getCheckDigit(cardNumber)
    // Return the complete card number
    return cardNumber
}

// Function to calculate the check digit using the Luhn algorithm
function getCheckDigit(cardNumber: string): string {
    // Initialize the sum to 0
    let sum = 0
    // Flag to determine whether to double the digit or not
    let shouldDouble = true

    // Loop through the card number digits from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        // Parse the current digit
        let digit = parseInt(cardNumber.charAt(i))

        // If the flag is set, double the digit
        if (shouldDouble) {
            digit *= 2
            // If the doubled digit is greater than 9, subtract 9
            if (digit > 9) {
                digit -= 9
            }
        }

        // Add the digit to the sum
        sum += digit
        // Toggle the flag for the next digit
        shouldDouble = !shouldDouble
    }

    // Calculate the check digit
    const checkDigit = newFunction(sum)
    // Return the check digit as a string
    return checkDigit.toString()
}

function newFunction(sum: number) {
    // TODO
    return 0
    // return (10 - (sum % 10)) % 10;
}
