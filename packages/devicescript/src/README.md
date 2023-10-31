---
title: PCF8563 Real-Time Clock Driver
description: DeviceScript driver for the PCF8563 real-time clock (RTC) peripheral.
keywords: PCF8563, Real-Time Clock, RTC, DeviceScript, Driver
---

# PCF8563 Real-Time Clock Driver

This is a DeviceScript driver for the PCF8563 real-time clock (RTC) peripheral.

## Usage

```typescript
import { PCF8563 } from "./pcf8563";

const rtc = new PCF8563(0x51);
await rtc.init();

const currentTime = await rtc.readTime();
console.log("Current time:", currentTime);

const newTime = new Date();
await rtc.writeTime(newTime);
console.log("Time updated to:", newTime);
```

## Sources

- [PCF8563 Datasheet](https://files.seeedstudio.com/wiki/round_display_for_xiao/RTC-PCF8563-datasheet.pdf)
- [Adafruit CircuitPython PCF8563](https://github.com/adafruit/Adafruit_CircuitPython_PCF8563)
- [tuupola/pcf8563](https://github.com/tuupola/pcf8563)
