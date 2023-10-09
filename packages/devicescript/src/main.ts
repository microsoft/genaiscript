import { pins, board } from "@dsboard/seeed_xiao_esp32c3"
import { PCF8563 } from "./pcf8563"

const rtc = new PCF8563()

async function displayTime() {
    const currentTime = await rtc.readTime()
    console.log(`Current time: ${currentTime}`)
}

await displayTime()
