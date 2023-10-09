import { pins, board } from "@dsboard/seeed_xiao_esp32c3"
import { PCF8563 } from "./pcf8563";
import { XiaoExpansionBoard } from "@devicescript/drivers";

const shield = new XiaoExpansionBoard()
const rtc = new PCF8563();
await rtc.init();
async function main() {
  const currentTime = await rtc.readTime();
  console.log(currentTime);
}

setInterval(main, 1000)
