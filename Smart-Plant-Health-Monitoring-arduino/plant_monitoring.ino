#include "secrets.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

// ---------- WIFI DETAILS ----------
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

// ---------- FLASK SERVER ----------
const char* serverUrl = "http://YOUR_SERVER_IP:5000/sensor-data";

// ---------- SENSOR PINS ----------
#define SOIL_PIN 34
#define DHT_PIN 4
#define LDR_PIN 32
#define DHT_TYPE DHT11

// ---------- CALIBRATION ----------
const int SOIL_DRY = 3295;
const int SOIL_WET = 1936;

const int LIGHT_COVERED = 4095;
const int LIGHT_UNCOVERED = 2018;

DHT dht(DHT_PIN, DHT_TYPE);

// ---------- PERCENTAGE FUNCTIONS ----------
int getSoilPercentage(int value) {
  return constrain(
    map(value, SOIL_DRY, SOIL_WET, 0, 100),
    0, 100
  );
}

int getLightPercentage(int value) {
  return constrain(
    map(value, LIGHT_COVERED, LIGHT_UNCOVERED, 0, 100),
    0, 100
  );
}

void setup() {
  Serial.begin(115200);

  dht.begin();

  Serial.println();
  Serial.println("========== FLORASENSE ==========");

  Serial.println("[WiFi] Connecting...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  Serial.println("[WiFi] Connected");
  Serial.println("[System] Ready");
  Serial.println("================================");
}

void loop() {

  // ---------- SENSOR READINGS ----------
  int soilRaw = analogRead(SOIL_PIN);
  int lightRaw = analogRead(LDR_PIN);

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[Error] DHT11 reading failed");
    delay(2000);
    return;
  }

  int soilPercent = getSoilPercentage(soilRaw);
  int lightPercent = getLightPercentage(lightRaw);

  // ---------- DISPLAY READINGS ----------
  Serial.println();
  Serial.println("-------- LIVE READINGS --------");

  Serial.print("Soil Moisture : ");
  Serial.print(soilPercent);
  Serial.println("%");

  Serial.print("Temperature   : ");
  Serial.print(temperature, 1);
  Serial.println(" C");

  Serial.print("Humidity      : ");
  Serial.print(humidity, 1);
  Serial.println("%");

  Serial.print("Light Level   : ");
  Serial.print(lightPercent);
  Serial.println("%");

  // ---------- JSON DATA ----------
  // Raw soil and light values are preserved
  // for existing Flask backend calibration.

  String jsonData = "{\"soil\":" + String(soilRaw) +
                    ",\"light\":" + String(lightRaw) +
                    ",\"temperature\":" + String(temperature, 1) +
                    ",\"humidity\":" + String(humidity, 1) + "}";

  // Keep JSON on its own line for serial_reader.py
  Serial.println(jsonData);

  // ---------- SEND TO FLASK ----------
  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", SENSOR_API_KEY);
    http.setTimeout(5000);

    int responseCode = http.POST(jsonData);

    if (responseCode > 0) {
      Serial.println("[Server] Data sent successfully");
    } else {
      Serial.print("[Server] Failed: ");
      Serial.println(http.errorToString(responseCode));
    }

    http.end();

  } else {
    Serial.println("[WiFi] Disconnected");
    WiFi.reconnect();
  }

  Serial.println("--------------------------------");

  delay(2000);
}
