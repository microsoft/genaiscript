import { pins, board } from "@dsboard/seeed_xiao_esp32c3"
import { PCF8563 } from "./pcf8563";
import { XiaoExpansionBoard } from "@devicescript/drivers";
import { schedule } from "@devicescript/runtime";
import { Date } from "./date";

const shield = new XiaoExpansionBoard()
const rtc = new PCF8563();
await rtc.init();
await rtc.writeTime(new Date(2021, 0, 1, 0, 0, 0));
async function main() {
  const currentTime = await rtc.readTime();
  console.log("Current time:", currentTime);
}

schedule(main, { interval: 1000})
