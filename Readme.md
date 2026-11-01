# 🌱 FloraSense – Smart Plant Health Monitoring System

An IoT-based plant health monitoring system that combines real-time sensor data, a web dashboard, and automated alerts to help users monitor plant conditions.

FloraSense uses an ESP32 and environmental sensors to collect plant-related data, sends readings to a Flask backend, and displays the information through an interactive web application.

## 🚀 Features

### 1. User Authentication
- User registration and login.
- Password hashing and verification.
- Session-based authentication.
- Profile management.
- Change password and logout functionality.

### 2. Live Plant Monitoring
- Real-time soil moisture monitoring.
- Temperature measurement.
- Humidity monitoring.
- Relative light intensity monitoring.
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
| Communication | Wi-Fi, HTTP, JSON |
| Firmware | Arduino IDE, C++ |
| Deployment | Gunicorn-compatible Flask application |

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
            | Wi-Fi / HTTP POST
            v
      Flask Backend
            |
            v
       SQLite Database
            |
            v
      Frontend Dashboard
            |
            v
     Live Monitoring
     Alerts & Plant Profiles
```

## 📁 Project Structure

```text
Smart-Plant-Health/
│
├── backend/
│   ├── app.py
│   └── serial_reader.py
│
├── frontend/
│   ├── assets/
│   ├── css/
│   ├── javascript/
│   ├── pages/
│   └── index.html
│
├── Smart-Plant-Health-Monitoring-Arduino/
│   ├── libraries/
│   ├── plant_monitoring.ino
│   ├── secrets.example.h
│   └── README.md
│
├── requirements.txt
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

- Python
- Arduino IDE
- ESP32 board package
- Git
- Required Arduino sensor libraries

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Smart-Plant-Health
```

### 2. Set Up the Python Environment

```bash
python -m venv .venv
```

Activate the environment:

**Windows:**
```bash
.venv\Scripts\activate
```

**Linux / macOS:**
```bash
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the Flask Backend

```bash
cd backend
python app.py
```

The backend will start on the configured Flask host and port.

### 5. Configure ESP32

1. Open `plant_monitoring.ino` in Arduino IDE.
2. Create a local `secrets.h` using `secrets.example.h` as a template.
3. Add your Wi-Fi credentials.
4. Configure the Flask server URL in the firmware.
5. Select the ESP32 board and correct COM port.
6. Upload the firmware.
7. Open Serial Monitor at 115200 baud.

**Important:** Never upload your actual `secrets.h` or Wi-Fi credentials to GitHub.

### 6. Open FloraSense

Open the application through the Flask server, register an account, and log in to access the dashboard.

## 🔗 Backend API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sensor-data` | Receive ESP32 sensor readings |
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

Soil and light values are transmitted as raw sensor readings and converted into percentages by the backend.

## 🔮 Future Scope

- Cloud-based data storage and historical analytics.
- Mobile application integration.
- Push notifications.
- Automated irrigation system.
- Advanced plant health analysis using machine learning.
- Remote monitoring from anywhere.

## 👥 Project Team

Smart Plant Health Monitoring Project Team

---

**FloraSense – Helping You Understand Your Plants Better.** 🌿