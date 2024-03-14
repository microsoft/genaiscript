# This is my favorite program!
for i in range(1, 45):
    print(i)

for c in range(ord('a'), ord('z') + 1):
    print(chr(c))

# And now, at the end:
print("The end")

class Dummy:
    def __init__(self):
        self.name = "Dummy Class"

    def display_name(self):
        return self.name
