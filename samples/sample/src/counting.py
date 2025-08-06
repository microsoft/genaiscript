# Loop to print numbers from 1 to 44
# Range starts from 1 and goes up to, but does not include, 45
for i in range(1, 45):
    print(i)

# Loop to print lowercase letters from 'a' to 'z'
# Uses ASCII values to iterate through character codes
for c in range(ord("a"), ord("z") + 1):
    print(chr(c))

# Indicate the end of the sequence
print("The end")


class Dummy:
    """A simple class representing a dummy object with a name."""

    def __init__(self):
        """
        Initialize the Dummy class with a default name attribute.

        Attributes:
            name (str): The default name of the dummy object.
        """
        self.name = "Dummy Class"

    def display_name(self):
        """
        Return the name of the dummy object.

        Returns:
            str: The name of the dummy object.
        """
        return self.name
