# 🌱 FloraSense – Smart Plant Health Monitoring System

FloraSense is an IoT-based plant health monitoring system that combines an ESP32, environmental sensors, a Flask backend, and an interactive web dashboard to monitor plant conditions.

The system collects sensor readings, sends them securely over Wi-Fi to the backend, stores the data in SQLite, and displays live readings and alerts through the web application.

**Live Application:** https://florasense-krfv.onrender.com  
**GitHub Repository:** https://github.com/akshara297/FloraSense

## 🚀 Features

### 1. User Authentication
- User registration and login.
- Password hashing and verification.
- Session-based authentication.
- Profile management.
- Change password and logout functionality.

### 2. Live Plant Monitoring
- Soil moisture monitoring.
- Temperature measurement.
- Humidity monitoring.
- Light intensity monitoring.
- Live sensor readings displayed on the dashboard.

### 3. Plant Profiles
- Multiple plant profiles.
- Plant-specific monitoring ranges.
- Plant information and health monitoring.

### 4. Automated Alerts
- Detects sensor readings outside configured thresholds.
- Generates alerts after consecutive out-of-range readings.
- Automatically resolves active alerts when readings return to the configured range.
- Displays alert information on the dashboard.

### 5. Settings Management
- User profile updates.
- Password management.
- Notification preferences.
- ESP32 device status monitoring.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python, Flask |
| Database | SQLite |
| Hardware | ESP32 |
| Sensors | Soil Moisture Sensor, DHT11, LDR |
| Communication | Wi-Fi, HTTPS, JSON |
| Firmware | Arduino IDE, C++ |
| Deployment | Render, Gunicorn |

## 🔌 Hardware Components

- ESP32 Development Board
- Soil Moisture Sensor
- DHT11 Temperature and Humidity Sensor
- LDR (Light Dependent Resistor)
- Breadboard
- Jumper Wires

### Sensor Pin Configuration

| Sensor | ESP32 GPIO |
|---|---|
| Soil Moisture Sensor | GPIO 34 |
| DHT11 | GPIO 4 |
| LDR | GPIO 32 |

## 🏗️ System Architecture

```text
       ESP32 + Sensors
              |
              | Sensor Readings
              | Wi-Fi / HTTPS POST
              v
        Flask Backend
              |
              v
       SQLite Database
              |
              v
      Frontend Dashboard
              |
       ----------------
       |              |
   Live Data        Alerts
       |
   Plant Profiles
```

## 📁 Project Structure

```text
FloraSense/
│
├── backend/
│   ├── app.py
│   ├── serial_reader.py
│   └── plant.db
│
├── frontend/
│   ├── assets/
│   ├── css/
│   ├── javascript/
│   ├── pages/
│   └── index.html
│
├── Smart-Plant-Health-Monitoring-arduino/
│   ├── libraries/
│   ├── plant_monitoring/
│   │   ├── plant_monitoring.ino
│   │   └── secrets.h
│   ├── r4.pem
│   ├── secrets.example.h
│   └── README.md
│
├── requirements.txt
├── .gitignore
└── README.md
```

**Note:** `secrets.h` contains local credentials and must never be committed to GitHub. Create it locally using `secrets.example.h` as a reference.

## ⚙️ Installation and Setup

### Prerequisites

- Python 3
- Arduino IDE
- ESP32 board package
- Git
- Required Arduino sensor libraries

### 1. Clone the Repository

```bash
git clone https://github.com/akshara297/FloraSense.git
cd FloraSense
```

### 2. Set Up the Python Environment

```bash
python -m venv .venv
```

Activate the environment:

**Windows**
```bash
.venv\Scripts\activate
```

**Linux / macOS**
```bash
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Configure the required Flask secret key and sensor API key in your local environment.

Keep all secret values private. Do not commit credentials or actual secret files.

### 5. Start the Flask Backend

```bash
cd backend
python app.py
```

The application will start on the configured Flask host and port.

### 6. Configure ESP32

1. Open `plant_monitoring/plant_monitoring.ino` in Arduino IDE.
2. Create a local `secrets.h` using `secrets.example.h` as a template.
3. Add your Wi-Fi credentials and sensor API key.
4. Configure the deployed backend URL in the firmware.
5. Select the ESP32 board and correct COM port.
6. Upload the firmware.
7. Open Serial Monitor at 115200 baud.

The ESP32 sends sensor readings to the deployed Flask backend using HTTPS.

**Important:** Never upload actual Wi-Fi credentials, API keys, or `secrets.h` to GitHub.

### 7. Open FloraSense

Visit:

https://florasense-krfv.onrender.com

Register an account and log in to access the dashboard.

## 🔗 Backend API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sensor-data` | Receive ESP32 sensor readings |
| GET | `/sensor-data` | Retrieve sensor readings |
| GET | `/alerts` | Retrieve alerts |
| GET | `/alerts/summary` | Retrieve alert summary |
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Authenticate a user |
| GET | `/auth/me` | Retrieve logged-in user details |
| PUT | `/auth/profile` | Update user profile |
| POST | `/auth/change-password` | Change account password |
| POST | `/auth/logout` | Log out the user |

## 📊 Sensor Data Format

The ESP32 sends sensor readings to the Flask backend in JSON format.

Example:

```json
{
  "soil": 2100,
  "light": 2550,
  "temperature": 27.0,
  "humidity": 62.0
}
```

Soil and light readings are collected as raw sensor values and processed for dashboard display.

## 🚀 Deployment

FloraSense is deployed using Render.

- Backend server: Flask
- Production server: Gunicorn
- Deployment platform: Render
- Sensor communication: HTTPS

**Live URL:** https://florasense-krfv.onrender.com

## ⚠️ Current Limitations

- The current deployment uses SQLite on Render's free instance. Its local filesystem is ephemeral, so database contents may not survive restarts or redeployments.
- Sensor readings and alerts are not yet isolated by individual