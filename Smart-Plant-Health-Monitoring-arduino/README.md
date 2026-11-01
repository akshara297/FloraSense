# Smart Plant Health Monitoring System – ESP32 Firmware

## About

This folder contains the ESP32 firmware for **FloraSense – Smart Plant Health Monitoring System**, an IoT-based project designed to monitor important environmental conditions affecting plant health.

The ESP32 collects sensor readings and sends the data to a Flask backend through Wi-Fi.

## Hardware Components

- ESP32 Development Board
- Soil Moisture Sensor
- DHT11 Temperature and Humidity Sensor
- LDR (Light Dependent Resistor)
- Breadboard
- Jumper Wires

## Sensor Connections

| Component | ESP32 GPIO |
|---|---|
| Soil Moisture Sensor | GPIO 34 |
| DHT11 Data Pin | GPIO 4 |
| LDR | GPIO 32 |

## Features

- Monitors soil moisture.
- Measures temperature and humidity.
- Measures relative light intensity.
- Displays readable sensor values in the Serial Monitor.
- Connects ESP32 to Wi-Fi.
- Sends sensor readings to the Flask backend using HTTP POST requests.
- Supports live sensor data updates on the FloraSense dashboard.

## Libraries Required

Install these libraries through the Arduino IDE Library Manager:

- DHT sensor library by Adafruit
- Adafruit Unified Sensor

The following headers are provided by the ESP32 Arduino board package:

- WiFi.h
- HTTPClient.h

## Setup Instructions

1. Install the Arduino IDE.
2. Install the ESP32 board package.
3. Install the required sensor libraries.
4. Open the `.ino` firmware file.
5. Configure your Wi-Fi credentials.
6. Configure the Flask server URL.
7. Select the appropriate ESP32 board and COM port.
8. Upload the firmware.
9. Open the Serial Monitor at **115200 baud**.

## Backend Integration

The ESP32 sends sensor readings to the Flask backend through the `/sensor-data` API endpoint.

The transmitted JSON contains:

- Soil sensor reading
- Light sensor reading
- Temperature
- Humidity

The Flask backend processes the incoming readings and stores them in the SQLite database for use by the FloraSense dashboard and alert system.

**Note:** The soil and light sensor values are transmitted as raw readings. Percentage conversion is handled by the backend.

## Project Structure

```text
Smart-Plant-Health-Monitoring-Arduino/
├── libraries/
├── plant_monitoring.ino
└── README.md
```

## Team

Smart Plant Health Monitoring Project Team

Part of the FloraSense project.