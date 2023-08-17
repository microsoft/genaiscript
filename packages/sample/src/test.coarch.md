# Image resize {#OI62}

A command line that takes a file name, a size, and an output file name, resizes the image using the best algorithm, and saves the resized image. Use node.js LTS.

<!-- @prompt

Use the writing style of software technical writer.

-->

## Parse arguments `x`, `y` **z** #2 {#DE00}

Read the `filename: string`, `size: number` and `outputfilename: string`
from the command line arguments. `filename` and `size` are mandatory and `outputfilename` is optional.

-   [feature](./test/feature.DE00.feature)

### Read command line arguments {#LM14}

Extract `filename`, `size`, and `outputfilename` from the command line arguments.

-   [feature](./test/feature.LM14.feature)


### Validate mandatory arguments {#RF43}

Ensure `filename` and `size` are provided.

-   [feature](./test/feature.RF43.feature)


### Set default outputfilename if not provided {#ND68}

If `outputfilename` is not provided, set a default value.

### Parse arguments {#UL21}

Parse `filename` as a string, `size` as a number, and `outputfilename` as a string.

### Handle parsing errors {#NK12}

Catch any errors that occur during the parsing process and display an appropriate error message.

## Create and Fill Buffer {#HJ77}

Create a buffer, then fill it with binary data from an image file.

### Create buffer {#SJ97}

### Fill up the buffer {#YI54}

-   [feature](./test/feature.YI54.feature)


## Resize image {#SB87}

Using image library to resize image using the best algorithm.

## Save Image {#LT55}

Initialize File API, load image, create output file, save image to output file, and close output file.

-   [feature](./test/feature.LT55.feature)


### Initialize File API {#EN19}

Set up and import necessary file APIs for image saving.

### Load Image {#VR67}

Load the image to be saved using appropriate image handling libraries.

### Create Output File {#AF97}

Create a new output file with the desired file format and name.

### Save Image to Output File {#GJ73}

Use the file APIs to write the loaded image data to the output file.

### Close Output File {#CH43}

Close the output file to ensure proper saving and avoid data corruption.
