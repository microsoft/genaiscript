script({
    title: "stress testing tools",
})

$`Check the current time and weather and give a report to the user.`

// this one always throws
defTool("weather", "Get the current weather", {}, async () => {
    throw new Error("This tool throws an exception")
})

// massive return
defTool("time", "Get the curren time", {}, async () => {
    const crypto = await import("crypto")
    const randomString = crypto.randomBytes(1024 * 1024).toString("base64")
    return randomString
})
