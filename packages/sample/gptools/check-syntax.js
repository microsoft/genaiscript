process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
    let chunk;
    // Use a loop to make sure we read all available data.
    while ((chunk = process.stdin.read()) !== null) {
        console.log(`Received data: ${chunk}`);
    }
});

process.stdin.on('end', () => {
    console.log('End of input');
    process.exit(0)
});