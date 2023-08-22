# Image resize {#YU34}

A command line application that takes a file name, a size, and an output file name, resizes the image using the best algorithm, and saves the resized image. Use node.js LTS.

*   [node](./image.mjs)

## Parse command line arguments {#UV61}
Extract file name, size, and output file name from the command line input.

## Validate Input {#QY23}
Ensure all arguments are present.
Verify the input file exists and is in a valid image format. Validate the dimensions and output file name.

## Load image {#MD29}
Use a suitable library to load the image from the input file.

## Determine Optimal Algorithm {#KU58}
Select the most suitable resizing algorithm considering the input image and target size.

## Resize image {#OR24}
Apply the chosen algorithm to resize the image to the specified size.

## Save resized image {#IA42}
Save the resized image to the output file name provided.

## Display success message {#DT13}
Inform the user that the resizing process is complete and provide the output file name.
