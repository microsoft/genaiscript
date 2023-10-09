# PCF8563 DeviceScript Driver

This is a DeviceScript driver for the PCF8563 real-time-clock (RTC).

## Usage

```typescript
import { PCF8563 } from "./pcf8563";

async function main() {
  const rtc = new PCF8563();
  await rtc.init();
  const currentTime = await rtc.readTime();
  console.log("Current time:", currentTime);
}

main();
```

## Sources

- [Datasheet](https://files.seeedstudio.com/wiki/round_display_for_xiao/RTC-PCF8563-datasheet.pdf)
- [Adafruit CircuitPython](https://github.com/adafruit/Adafruit_CircuitPython_PCF8563)
