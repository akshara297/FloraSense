import serial
import json
import urllib.request

ser = serial.Serial("COM11", 115200, timeout=2)

API_URL = "http://127.0.0.1:5000/sensor-data"

print("Reading ESP32 sensor data...")

while True:
    line = ser.readline().decode("utf-8", errors="ignore").strip()
    if line:
        print("Received:",line)

    if line.startswith("{") and line.endswith("}"):
        try:
            data = json.loads(line)

            req = urllib.request.Request(
                API_URL,
                data=json.dumps(data).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req) as response:
                print("Saved to database:", data)

        except Exception as e:
            print("Error:", e)