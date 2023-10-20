# Elecfreaks Pico:ed

ELECFREAKS Pico:ed V2 is a development board based on Raspberry Pi RP2040 MCU. It uses a dual-core Arm Cortex-M0+ processor with 264KB RAM. The front of the board contains two buttons and a 7x17 dot matrix screen, which can be conveniently used for classroom teaching.

-   [Home](https://shop.elecfreaks.com/products/elecfreaks-pico-ed-v2)
-   [elecfreaks_picoed.board.json](../boards/elecfreaks_picoed.board.json)

![pinout](https://shop.elecfreaks.com/cdn/shop/files/12.12-02_1800x.jpg?v=1670829983)

## Features

1. RP2040: Designed by Raspberry Pi, RP2040 features a dual-core Arm Cortex-M0+ processor with 264kB internal RAM and support for up to 16MB of off-chip flash.
2. USB & Battery Connector
3. Power status LED and USB data transfer LED.
4. 7\*17 Dot-matrix Screen
5. Bootsel & Reset Button.
6. 25-pin notched edge connector.
7. Onboard Buzzer.
8. Compatible With Most micro:bit Accessories
9. Exquisite design
10. 2 x Programmable Buttons
11. You can use MicroBlocks for graphical programming.

## Pinout

This pintout was generated from https://shop.elecfreaks.com/cdn/shop/files/12.12-02_1800x.jpg?v=1670829983, through ChatGPT 4 (prompt: generate a markdown table of the pinout image).

| DeviceScript Pin | Function   | Pico:ed Pin | Alternate Functions |
| ---------------- | ---------- | ----------- | ------------------- |
| GND              | Ground     | GND         | -                   |
| GND              | Ground     | GND         | -                   |
| P20              | -          | GP18        | SPI0 SCK, I2C1 SDA  |
| P19              | -          | GP19        | SPI0 TX, I2C1 SCL   |
| 3V3              | 3.3V Power | 3V3         | -                   |
| P16              | -          | GP16        | SPI0 RX, I2C0 SDA   |
| P15              | -          | GP15        | SPI0 TX, UART0 TX   |
| P14              | -          | GP14        | SPI0 SCK, I2C1 SDA  |
| P13              | -          | GP13        | SPI0 CSn, I2C0 SCL  |
| P12              | -          | GP12        | SPI1 RX, I2C0 SDA   |
| P11              | -          | GP11        | SPI1 TX, UART0 TX   |
| P10              | -          | GP10        | SPI0 SCK, I2C0 SCL  |
| P9               | -          | GP9         | SPI0 CSn, UART1 RX  |
| P8               | -          | GP8         | SPI1 RX, UART1 TX   |
| P7               | -          | GP7         | SPI1 TX             |
| P6               | -          | GP6         | SPI0 SCK, I2C1 SDA  |
| P5               | -          | GP5         | SPI0 CSn, I2C0 SCL  |
| P4               | -          | GP4         | SPI1 RX, UART1 RX   |
| P3               | -          | GP29        | ADC3                |
| P2               | -          | GP28        | ADC2                |
| P1               | -          | GP27        | ADC1, I2C1 SCL      |
| P0               | -          | GP26        | ADC0, I2C1 SDA      |
| -                | -          | GP20        | -                   |
| -                | -          | GP25        | -                   |
| -                | -          | GP3         | Buzzer              |
| -                | -          | GP21        | -                   |
| P20              | -          | GP18        | -                   |

-   Map DeviceScript pins to Pico:ed pins
-   A pin GPXX is mapped to the hardware number XX.
-   pin P20 should have been mapped to GP18 which maps to 18
-   remove log section
-   Jacdac on pin 12

## Services

-   Buzzer on pin 3
-   Dot matrix screen using IS31FL3731
-   Button A on pin 20
-   Button B on pin 21
