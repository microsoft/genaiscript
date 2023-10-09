# PCF8563 DeviceScript Driver

This driver is for the PCF8563 real-time-clock (RTC) peripherical.

Sources used to generate the code:
- [datasheet](https://files.seeedstudio.com/wiki/round_display_for_xiao/RTC-PCF8563-datasheet.pdf)
- [Adafruit CircuitPython](https://github.com/adafruit/Adafruit_CircuitPython_PCF8563)
- [Jacdac service](https://github.com/microsoft/jacdac/blob/main/services/realtimeclock.md)

## Usage

Import the `PCF8563` class from `pcf8563.ts` and create an instance. Use the `readTime()` function to get the current time as a JavaScript Date object.

Example:

```typescript
import { PCF8563 } from "./pcf8563";

const rtc = new PCF8563();
const currentTime = rtc.readTime();
console.log(`Current time: ${currentTime}`);
```
