import { PCF8563 } from "./pcf8563";

async function main() {
  const rtc = new PCF8563();
  await rtc.init();
  const currentTime = await rtc.readTime();
  console.log("Current time:", currentTime);
}

await main();
