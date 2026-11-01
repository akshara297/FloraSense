
#include "secrets.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "DHT.h"

// ---------- HTTPS ROOT CERTIFICATE ----------
const char* rootCACertificate = R"EOF(
-----BEGIN CERTIFICATE-----
MIICCTCCAY6gAwIBAgINAgPlwGjvYxqccpBQUjAKBggqhkjOPQQDAzBHMQswCQYD
VQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEUMBIG
A1UEAxMLR1RTIFJvb3QgUjQwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAwMDAw
WjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2Vz
IExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjQwdjAQBgcqhkjOPQIBBgUrgQQAIgNi
AATzdHOnaItgrkO4NcWBMHtLSZ37wWHO5t5GvWvVYRg1rkDdc/eJkTBa6zzuhXyi
QHY7qca4R9gq55KRanPpsXI5nymfopjTX15YhmUPoYRlBtHci8nHc8iMai/lxKvR
HYqjQjBAMA4GA1UdDwEB/wQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQW
BBSATNbrdP9JNqPV2Py1PsVq8JQdjDAKBggqhkjOPQQDAwNpADBmAjEA6ED/g94D
9J+uHXqnLrmvT/aDHQ4thQEd0dlq7A/Cr8deVl5c1RxYIigL9zC2L7F8AjEA8GE8
p/SgguMh1YQdc4acLa/KNJvxn7kjNuK8YAOdgLOaVsjh4rsUecrNIdSUtUlD
-----END CERTIFICATE-----
)EOF";

// ---------- WIFI DETAILS ----------
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

// ---------- FLASK SERVER ----------
const char* serverUrl =
    "https://florasense-krfv.onrender.com/sensor-data";

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

// ---------- SECURE CLIENT ----------
WiFiClientSecure secureClient;

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

// ---------- SETUP ----------
void setup() {
    Serial.begin(115200);

    dht.begin();

    Serial.println();
    Serial.println("========== FLORASENSE ==========");

    Serial.println("[WiFi] Connecting...");

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.println("[WiFi] Connected");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());

    // Configure HTTPS certificate verification
    secureClient.setCACert(rootCACertificate);
    secureClient.setHandshakeTimeout(15);

    Serial.println("[HTTPS] Certificate verification configured");
    Serial.println("[System] Ready");
    Serial.println("================================");
}

// ---------- MAIN LOOP ----------
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
    String jsonData = "{\"soil\":" + String(soilRaw) +
                      ",\"light\":" + String(lightRaw) +
                      ",\"temperature\":" + String(temperature, 1) +
                      ",\"humidity\":" + String(humidity, 1) + "}";

    Serial.println(jsonData);

    // ---------- SEND TO FLASK ----------
    if (WiFi.status() == WL_CONNECTED) {

        HTTPClient http;

        http.setTimeout(30000);

        if (http.begin(secureClient, serverUrl)) {

            http.addHeader("Content-Type", "application/json");
            http.addHeader("X-API-Key", SENSOR_API_KEY);

            Serial.println("[Server] Sending sensor data...");

            int responseCode = http.POST(jsonData);

            if (responseCode > 0) {

                Serial.print("[Server] HTTP Status: ");
                Serial.println(responseCode);

                if (responseCode >= 200 && responseCode < 300) {
                    Serial.println("[Server] Data sent successfully");
                } else {
                    Serial.println("[Server] Server returned an error");
                    Serial.println(http.getString());
                }

            } else {
                Serial.print("[Server] Failed: ");
                Serial.println(http.errorToString(responseCode));
            }

            http.end();

        } else {
            Serial.println("[HTTPS] Connection initialization failed");
        }

    } else {
        Serial.println("[WiFi] Disconnected");
        WiFi.reconnect();
    }

    Serial.println("--------------------------------");

    delay(2000);
}
