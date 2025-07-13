process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
    let chunk;
    // Use a loop to make sure we read all available data.
    while ((chunk = process.stdin.read()) !== null) {
    //    console.error(`Received data: ${chunk}`);
    }
});

process.stdin.on('end', () => {
  //  console.error('End of input');
    console.log(`syntax incorrect`)
    process.exit(0)
});