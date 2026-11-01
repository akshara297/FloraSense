const API_URL = "/sensor-data";

const CUSTOM_PLANTS_KEY = "floraSenseCustomPlants";

// ---------------- PLANT INFORMATION ----------------

const plants = {
    tulsi: {
        name: "Tulsi",
        botanicalName: "Ocimum tenuiflorum",
        description: "A fragrant, leafy herb that brings a little green energy to a sunny corner.",
        image: "../assets/images/asset1_2.png",
        aboutImage: "../assets/images/tulsi_botanical.png",
        aboutImageAlt: "Botanical illustration of Tulsi",

        aboutDetails: [
            {
                label: "Most preferable soil type",
                points: [
                    "Fertile, moist soil that drains freely.",
                    "Avoid waterlogged growing media."
                ]
            },
            {
                label: "Sunlight requirements",
                points: [
                    "Generally prefers a sunny, open position.",
                    "Consider local heat when choosing exposure."
                ]
            },
            {
                label: "Watering requirements",
                points: [
                    "Water when the soil surface begins to dry.",
                    "Let excess water drain."
                ]
            },
            {
                label: "Garden appeal",
                points: [
                    "Fragrant foliage makes it a sensory herb.",
                    "Leaves are used as a culinary herb."
                ]
            }
        ],

        care: {
            watering: "Water when the top of the soil begins to feel dry. Avoid leaving the pot standing in water.",
            sunlight: "Give it a bright spot with several hours of sunlight.",
            soil: "Use a loose potting mix and a container with drainage holes.",
            fertilizer: "Feed lightly during active growth, following the product label."
        },

        idealRanges: {
            moisture: { min: 40, max: 60, unit: "%" },
            temperature: { min: 20, max: 30, unit: "°C" },
            humidity: { min: 40, max: 70, unit: "%" },
            light: { min: 50, max: 80, unit: "%" }
        }
    },

    aloe: {
        name: "Aloe Vera",
        botanicalName: "Aloe vera",
        description: "A sculptural succulent with thick leaves, suited to a bright home.",
        image: "../assets/images/asset1_2.png",

        aboutDetails: [
            {
                label: "Soil",
                points: [
                    "Use a gritty, fast-draining succulent mix.",
                    "A pot with drainage helps excess water escape."
                ]
            },
            {
                label: "Light",
                points: [
                    "Choose a bright location.",
                    "Acclimate gradually to stronger direct sun."
                ]
            },
            {
                label: "Water",
                points: [
                    "Allow the potting mix to dry between waterings.",
                    "Water less often in cool periods."
                ]
            }
        ],

        care: {
            watering: "Water thoroughly, then let the potting mix dry before watering again.",
            sunlight: "Place in a bright location.",
            soil: "Choose a fast-draining cactus or succulent mix.",
            fertilizer: "Use a light, occasional feed during active growth."
        }
    },

    rose: {
        name: "Rose",
        botanicalName: "Rosa",
        description: "A classic flowering shrub that rewards a bright location and attentive care.",
        image: "../assets/images/asset1_2.png",

        aboutDetails: [
            {
                label: "Soil",
                points: [
                    "Use fertile soil that drains well.",
                    "Container requirements vary with rose variety."
                ]
            },
            {
                label: "Light",
                points: [
                    "Select a bright, sunny site where suitable.",
                    "Follow guidance for the specific variety."
                ]
            },
            {
                label: "Water",
                points: [
                    "Water the root area when soil begins to dry.",
                    "Avoid keeping roots waterlogged."
                ]
            }
        ],

        care: {
            watering: "Water the soil when it starts to dry.",
            sunlight: "Choose a bright, sunny position.",
            soil: "Use fertile, well-draining soil.",
            fertilizer: "Use a rose feed according to its label."
        }
    },

    cactus: {
        name: "Cactus",
        botanicalName: "Cactaceae",
        description: "A distinctive plant that prefers strong light and well-draining soil.",
        image: "../assets/images/asset1_2.png",

        aboutDetails: [
            {
                label: "Soil",
                points: [
                    "Use a gritty, fast-draining cactus mix.",
                    "Choose a container with drainage holes."
                ]
            },
            {
                label: "Light",
                points: [
                    "Many cacti prefer bright conditions.",
                    "Light needs vary by species."
                ]
            },
            {
                label: "Water",
                points: [
                    "Let the growing mix dry between waterings.",
                    "Adjust watering for the species and season."
                ]
            }
        ],

        care: {
            watering: "Water sparingly and let the mix dry between waterings.",
            sunlight: "Provide a bright location.",
            soil: "Use a gritty, fast-draining cactus mix.",
            fertilizer: "Use cactus fertilizer as directed on its label."
        }
    }
};


// ---------------- CUSTOM PLANTS ----------------

function loadCustomPlants() {
    try {
        const savedPlants = JSON.parse(
            localStorage.getItem(CUSTOM_PLANTS_KEY) || "[]"
        );

        savedPlants.forEach((plant) => {
            if (!plant.id || !plant.name) return;

            plants[plant.id] = {
                name: plant.name,
                botanicalName: "Custom plant",
                description: `Your custom plant profile for ${plant.name}.`,
                image: "../assets/images/asset1_2.png",

                aboutDetails: [
                    {
                        label: "Plant information",
                        points: [
                            "This plant was added by the user.",
                            "Plant-specific information can be configured later."
                        ]
                    }
                ],

                care: {
                    watering: "Plant-specific watering information is not configured yet.",
                    sunlight: "Plant-specific sunlight information is not configured yet.",
                    soil: "Plant-specific soil information is not configured yet.",
                    fertilizer: "Plant-specific fertilizer information is not configured yet."
                }
            };
        });

    } catch (error) {
        console.error("Could not load custom plants:", error);
    }
}

loadCustomPlants();


// ---------------- SENSOR DEFINITIONS ----------------

const sensorDefinitions = [
    {
        key: "moisture",
        name: "Soil Moisture",
        unit: "%",
        icon: `<path d="M16 4C12 11 7 16 7 21a9 9 0 0 0 18 0c0-5-5-10-9-17Z"/>`
    },
    {
        key: "temperature",
        name: "Temperature",
        unit: "°C",
        icon: `<path d="M13 19V7a4 4 0 0 1 8 0v12a8 8 0 1 1-8 0Z"/>`
    },
    {
        key: "humidity",
        name: "Humidity",
        unit: "%",
        icon: `<path d="M8 24a6 6 0 0 1 0-12 9 9 0 0 1 17 3 5 5 0 0 1 0 9Z"/>`
    },
    {
        key: "light",
        name: "Relative Light",
        unit: "%",
        icon: `<circle cx="16" cy="16" r="6"/>`
    }
];

const careDefinitions = [
    {
        key: "watering",
        title: "Watering",
        icon: `<path d="M16 4C12 11 7 16 7 21a9 9 0 0 0 18 0c0-5-5-10-9-17Z"/>`
    },
    {
        key: "sunlight",
        title: "Sunlight",
        icon: `<circle cx="16" cy="16" r="6"/>`
    },
    {
        key: "soil",
        title: "Soil",
        icon: `<path d="M4 13h24l-3 14H7L4 13Z"/>`
    },
    {
        key: "fertilizer",
        title: "Fertilizer",
        icon: `<path d="M16 27V14m0 8c-7 0-10-4-10-10"/>`
    }
];


// ---------------- HTML ELEMENTS ----------------

const plantSelect = document.querySelector("#plant-select");
const plantImage = document.querySelector("#plant-image");
const aboutImage = document.querySelector("#about-image");
const aboutImageUnavailable = document.querySelector("#about-image-unavailable");


// ---------------- SENSOR CONVERSION ----------------

function convertSoilMoisture(rawValue) {
    const airValue = 3295;
    const waterValue = 1936;

    const percentage =
        ((airValue - rawValue) / (airValue - waterValue)) * 100;

    return Math.max(0, Math.min(100, percentage));
}

function convertLight(rawValue) {
    const coveredValue = 4095;
    const uncoveredValue = 2018;

    const percentage =
        ((coveredValue - rawValue) /
        (coveredValue - uncoveredValue)) * 100;

    return Math.max(0, Math.min(100, percentage));
}


// ---------------- LIVE SENSOR READINGS ----------------

function showUnavailableReadings(message) {
    const grid = document.querySelector("#readings-grid");

    grid.innerHTML = sensorDefinitions.map((sensor) => `
        <article class="profile-sensor-card ${sensor.key}">
            <span class="profile-sensor-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32">${sensor.icon}</svg>
            </span>

            <span class="sensor-name">${sensor.name}</span>

            <strong class="sensor-value unavailable">
                Unavailable
            </strong>

            <span class="sensor-status">${message}</span>
        </article>
    `).join("");
}


function renderReadings(data) {
    const grid = document.querySelector("#readings-grid");

    const readings = {
        moisture: convertSoilMoisture(Number(data.soil)),
        temperature: Number(data.temperature),
        humidity: Number(data.humidity),
        light: convertLight(Number(data.light))
    };

    grid.innerHTML = sensorDefinitions.map((sensor) => {
        const value = readings[sensor.key];

        return `
            <article class="profile-sensor-card ${sensor.key}">
                <span class="profile-sensor-icon" aria-hidden="true">
                    <svg viewBox="0 0 32 32">${sensor.icon}</svg>
                </span>

                <span class="sensor-name">${sensor.name}</span>

                <strong class="sensor-value">
                    ${value.toFixed(1)}
                    <small>${sensor.unit}</small>
                </strong>

                <span class="sensor-status">
                    Live sensor reading
                </span>
            </article>
        `;
    }).join("");

    const sampleLabel = document.querySelector(
        ".readings-section .sample-label"
    );

    if (sampleLabel) {
        sampleLabel.textContent = "Live Sensor Data";
    }
}


async function updateLiveReadings() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not fetch sensor readings");
        }

        const readings = await response.json();

        if (!Array.isArray(readings) || readings.length === 0) {
            showUnavailableReadings("Waiting for sensor data");

            const label = document.querySelector(
                ".readings-section .sample-label"
            );

            if (label) label.textContent = "Waiting for Data";

            return;
        }

        renderReadings(readings[0]);

    } catch (error) {
        console.error("Live readings error:", error);
        showUnavailableReadings("Backend connection unavailable");

        const label = document.querySelector(
            ".readings-section .sample-label"
        );

        if (label) label.textContent = "Connection Unavailable";
    }
}


// ---------------- PLANT INFORMATION ----------------

function renderRanges() {
    const grid = document.querySelector("#ranges-grid");
    const plant = plants.tulsi;

    if (!grid || !plant || !plant.idealRanges) {
        console.error("Tulsi ideal sensor ranges are unavailable.");
        return;
    }

    grid.innerHTML = sensorDefinitions.map((sensor) => {
        const range = plant.idealRanges[sensor.key];

        return `
            <article class="profile-sensor-card ${sensor.key}">
                <span class="profile-sensor-icon" aria-hidden="true">
                    <svg viewBox="0 0 32 32">${sensor.icon}</svg>
                </span>

                <span class="sensor-name">${sensor.name}</span>

                <strong class="sensor-value">
                    ${range.min}–${range.max}
                    <small>${range.unit}</small>
                </strong>

                <span class="sensor-status">
                    Ideal range for Tulsi
                </span>
            </article>
        `;
    }).join("");
}


function renderCare(plant) {
    document.querySelector("#care-grid").innerHTML =
        careDefinitions.map((care) => `
            <article class="care-item">
                <span class="care-icon" aria-hidden="true">
                    <svg viewBox="0 0 32 32">${care.icon}</svg>
                </span>

                <h3>${care.title}</h3>

                <p>${plant.care[care.key]}</p>
            </article>
        `).join("");
}


function renderPlantInformation(plant) {
    document.querySelector("#plant-info").innerHTML =
        plant.aboutDetails.map((detail) => `
            <article class="plant-info-row">
                <h3 class="plant-info-label">${detail.label}</h3>

                <ul>
                    ${detail.points.map((point) => `
                        <li>${point}</li>
                    `).join("")}
                </ul>
            </article>
        `).join("");
}


// ---------------- RENDER SELECTED PLANT ----------------

function renderPlant(plantId) {
    const plant = plants[plantId];

    if (!plant) {
        console.error("Plant not found:", plantId);
        return;
    }

    document.querySelector("#plant-name").textContent = plant.name;

    document.querySelector("#botanical-name").innerHTML =
        `<em>${plant.botanicalName}</em>`;

    document.querySelector("#plant-description").textContent =
        plant.description;

    plantImage.src = plant.image;
    plantImage.alt = `Illustrated potted plant representing ${plant.name}`;

    if (plant.aboutImage) {
        aboutImage.hidden = false;
        aboutImageUnavailable.hidden = true;

        aboutImage.src = plant.aboutImage;
        aboutImage.alt = plant.aboutImageAlt || plant.name;

    } else {
        aboutImage.hidden = true;
        aboutImage.removeAttribute("src");
        aboutImageUnavailable.hidden = false;
    }

    renderPlantInformation(plant);
    renderCare(plant);
    renderRanges();

    updateLiveReadings();
}


// ---------------- IMAGE ERROR HANDLING ----------------

function hideBrokenImage(event) {
    event.currentTarget.hidden = true;

    if (event.currentTarget === aboutImage) {
        aboutImageUnavailable.hidden = false;
    }
}


// ---------------- EVENT LISTENERS ----------------

plantSelect.addEventListener("change", (event) => {
    renderPlant(event.target.value);
});

plantImage.addEventListener("error", hideBrokenImage);
aboutImage.addEventListener("error", hideBrokenImage);


// ---------------- INITIAL LOAD ----------------

renderPlant(plantSelect.value);

// Refresh live readings every 3 seconds.
setInterval(updateLiveReadings, 3000);
