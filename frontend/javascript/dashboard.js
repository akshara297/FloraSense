
const API_URL = "/sensor-data";

// Convert a value into a percentage between 0 and 100
function clamp(value) {
    return Math.max(0, Math.min(100, value));
}

// Update the two recommendation cards
function updateRecommendations(soil, light, temperature, humidity) {
    const recommendations = [];

    const plantSelect = document.querySelector("#plant-select");

    const plantName =
    plantSelect?.selectedOptions[0]?.textContent || "your plant";

    // Soil recommendations
    if (soil < 30) {
        recommendations.push({
            title: "Check soil moisture",
            message: "The soil moisture reading is low. Check the soil before watering."
        });
    } else if (soil > 85) {
        recommendations.push({
            title: "Check for excess moisture",
            message: "The soil moisture reading is high. Avoid adding more water for now."
        });
    }

    // Light recommendations
    if (light < 25) {
        recommendations.push({
            title: "Move to a brighter spot",
            message: "The relative light reading is low. Consider a brighter location."
        });
    }

    // Temperature recommendations
    if (temperature > 35) {
        recommendations.push({
            title: "Check the temperature",
            message: "The temperature is high. Consider moving the plant away from direct heat."
        });
    } else if (temperature < 18) {
        recommendations.push({
            title: "Check the surroundings",
            message: "The temperature is on the lower side. Keep the plant in a suitable environment."
        });
    }

    // Humidity recommendations
    if (humidity < 30) {
        recommendations.push({
            title: "Monitor humidity",
            message: "The humidity reading is low. Keep monitoring the surrounding conditions."
        });
    } else if (humidity > 85) {
        recommendations.push({
            title: "Monitor high humidity",
            message: "The humidity reading is high. Keep the plant in a well-ventilated area."
        });
    }

    // Add general suggestions when there are fewer than two issues
    if (recommendations.length < 2) {
        recommendations.push({
            title: "Maintain your watering routine",
            message: `Continue monitoring soil moisture before watering your ${plantName}.`
        });
    }

    if (recommendations.length < 2) {
        recommendations.push({
            title: "Maintain suitable lighting",
            message: "Continue monitoring the light conditions around your plant."
        });
    }

    const recommendationItems = document.querySelectorAll(
        ".recommendation-list li"
    );

    recommendationItems.forEach((item, index) => {
        const recommendation = recommendations[index];

        if (!recommendation) return;

        const title = item.querySelector("strong");
        const message = item.querySelector("p");

        if (title) title.textContent = recommendation.title;
        if (message) message.textContent = recommendation.message;
    });

    const adviceNote = document.querySelector(".advice-note");

    if (adviceNote) {
        adviceNote.textContent =
            "Suggestions are generated from initial sensor monitoring thresholds.";
    }
}

// Update plant health assessment
function updateHealthAssessment(soil, temperature, humidity, light) {
    const issues = [];

    if (soil < 30) {
        issues.push("Soil moisture is low.");
    } else if (soil > 85) {
        issues.push("Soil moisture is very high.");
    }

    if (temperature < 18) {
        issues.push("Temperature is on the lower side.");
    } else if (temperature > 35) {
        issues.push("Temperature is high.");
    }

    if (humidity < 30) {
        issues.push("Humidity is low.");
    } else if (humidity > 85) {
        issues.push("Humidity is high.");
    }

    if (light < 25) {
        issues.push("Relative light level is low.");
    }

    const status = issues.length > 0
        ? "Needs Attention"
        : "Looking Good";

    const message = issues.length > 0
        ? issues.join(" ")
        : "Your latest sensor readings are within the initial monitoring ranges.";

    const statusElement = document.querySelector(
        ".health-copy .status-pill"
    );

    const messageElement = document.querySelector(
        ".health-copy p"
    );

    const scoreElement = document.querySelector(
        ".health-score strong"
    );

    const scoreNote = document.querySelector(
        ".health-score small"
    );

    if (statusElement) {
        statusElement.textContent = status;
    }

    if (messageElement) {
        messageElement.textContent = message;
    }

    if (scoreElement) {
        scoreElement.textContent = status;
    }

    if (scoreNote) {
        scoreNote.textContent = "Based on live sensor readings";
    }

    const healthCard = document.querySelector(".health-score");

    if (healthCard) {
        healthCard.setAttribute("aria-label", status);
    }

    document.querySelector(
        ".health-copy .placeholder-tag"
    )?.remove();
}


let sensorChart = null;

function updateTrendChart(readings) {
    const canvas = document.getElementById("sensorTrendChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    // API readings newest-first hoti hain.
    // Graph ke liye oldest-first kar rahe hain.
    const history = [...readings].reverse();

    const labels = history.map(item => {
        const date = new Date(item.timestamp);

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    });

    const soilData = history.map(item =>
        clamp(((3295 - item.soil) / (3295 - 1936)) * 100)
    );

    const temperatureData = history.map(item =>
        Number(item.temperature)
    );

    const humidityData = history.map(item =>
        Number(item.humidity)
    );

    const lightData = history.map(item =>
        clamp(((4095 - item.light) / (4095 - 2018)) * 100)
    );

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: "Soil Moisture (%)",
                data: soilData,
                borderColor: "#4b9b69",
                backgroundColor: "#4b9b69",
                yAxisID: "y",
                tension: 0.3
            },
            {
                label: "Temperature (°C)",
                data: temperatureData,
                borderColor: "#e69b54",
                backgroundColor: "#e69b54",
                yAxisID: "y1",
                tension: 0.3
            },
            {
                label: "Humidity (%)",
                data: humidityData,
                borderColor: "#5998c8",
                backgroundColor: "#5998c8",
                yAxisID: "y2",
                tension: 0.3
            },
            {
                label: "Relative Light (%)",
                data: lightData,
                borderColor: "#d4ad43",
                backgroundColor: "#d4ad43",
                yAxisID: "y3",
                tension: 0.3
            }
        ]
    };

    if (sensorChart) {
        sensorChart.data = chartData;
        sensorChart.update("none");
        return;
    }

    sensorChart = new Chart(canvas, {
        type: "line",
        data: chartData,

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {
                legend: {
                    position: "bottom"
                },
                tooltip: {
                    enabled: true
                }
            },

            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Time"
                    }
                },

                y: {
                    type: "linear",
                    position: "left",
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: "Soil (%)"
                    }
                },

                y1: {
                    type: "linear",
                    position: "right",
                    title: {
                        display: true,
                        text: "Temperature (°C)"
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },

                y2: {
                    type: "linear",
                    position: "right",
                    min: 0,
                    max: 100,
                    display: false
                },

                y3: {
                    type: "linear",
                    position: "right",
                    min: 0,
                    max: 100,
                    display: false
                }
            }
        }
    });
}


// Main dashboard update function
async function updateDashboard() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not fetch sensor data");
        }

        const readings = await response.json();

        if (!readings.length) {
            const deviceStatus = document.querySelector(
            ".device-status small"
            );

            if (deviceStatus) {
            deviceStatus.textContent = "Waiting for sensor data";
            }

            return;
        }

        const latest = readings[0];
        updateTrendChart(readings);

        const cards = document.querySelectorAll(".sensor-card");

        // Soil moisture conversion
        // Calibration: air = 3295, water = 1936
        const soilMoisture = clamp(
            ((3295 - latest.soil) / (3295 - 1936)) * 100
        );

        cards[0].querySelector(".reading").innerHTML =
            `${soilMoisture.toFixed(1)}<span>%</span>`;

        cards[0].querySelector(".reading-note").textContent =
            `Raw reading: ${latest.soil} ADC`;

        cards[0].querySelector(".meter span").style.width =
            `${soilMoisture}%`;

        // Temperature
        const temperature = Number(latest.temperature);

        cards[1].querySelector(".reading").innerHTML =
            `${temperature.toFixed(1)}<span>°C</span>`;

        cards[1].querySelector(".reading-note").textContent =
            "Live DHT11 reading";

        const temperatureLevel = clamp(
            (temperature / 40) * 100
        );

        cards[1].querySelector(".meter span").style.width =
            `${temperatureLevel}%`;

        // Humidity
        const humidity = Number(latest.humidity);

        cards[2].querySelector(".reading").innerHTML =
            `${humidity.toFixed(1)}<span>%</span>`;

        cards[2].querySelector(".reading-note").textContent =
            "Live DHT11 reading";

        const humidityLevel = clamp(humidity);

        cards[2].querySelector(".meter span").style.width =
            `${humidityLevel}%`;

        // Light conversion
        // Calibration: covered = 4095, uncovered = 2018
        const lightLevel = clamp(
            ((4095 - latest.light) / (4095 - 2018)) * 100
        );

        cards[3].querySelector(".reading").innerHTML =
            `${lightLevel.toFixed(1)}<span>%</span>`;

        cards[3].querySelector(".reading-note").textContent =
            `Raw reading: ${latest.light} ADC`;

        cards[3].querySelector(".meter span").style.width =
            `${lightLevel}%`;

        // Remove sample placeholder labels
        document.querySelectorAll(".placeholder-tag").forEach(tag => {
            if (tag.closest(".sensor-card")) {
                tag.remove();
            }
        });

        // Device connection status
const deviceStatus = document.querySelector(
    ".device-status small"
);

if (deviceStatus) {
    const lastReadingTime = Date.parse(latest.timestamp);
    const currentTime = Date.now();

    const isRecent =
        Number.isFinite(lastReadingTime) &&
        currentTime - lastReadingTime <= 10000;

    deviceStatus.textContent = isRecent
        ? "Connected • Live data received"
        : "No recent sensor data";
}

        // Health assessment
        updateHealthAssessment(
            soilMoisture,
            temperature,
            humidity,
            lightLevel
        );

        // Dynamic recommendations
        updateRecommendations(
            soilMoisture,
            lightLevel,
            temperature,
            humidity
        );

        console.log("Dashboard updated:", latest);

    } catch (error) {
        console.error("Dashboard error:", error);

        const deviceStatus = document.querySelector(
            ".device-status small"
        );

        if (deviceStatus) {
            deviceStatus.textContent =
                "Unable to fetch sensor data";
        }
    }
}

// Fetch immediately and refresh every 3 seconds
updateDashboard();
setInterval(updateDashboard, 3000);
