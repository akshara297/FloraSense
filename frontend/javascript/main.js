
const USER_KEY = "floraSenseUserName";
const PLANTS_KEY = "floraSenseCustomPlants";
const SELECTED_PLANT_KEY = "floraSenseSelectedPlant";

const defaultPlants = [
    { id: "tulsi", name: "Tulsi" },
    { id: "aloe", name: "Aloe Vera" },
    { id: "rose", name: "Rose" },
    { id: "cactus", name: "Cactus" }
];

function getCustomPlants() {
    try {
        return JSON.parse(localStorage.getItem(PLANTS_KEY)) || [];
    } catch {
        return [];
    }
}

function getUserName() {
    let name = localStorage.getItem(USER_KEY);

    if (!name) {
        name = prompt("Welcome to FloraSense! What should we call you?");
        name = name?.trim() || "Plant Lover";
        localStorage.setItem(USER_KEY, name);
    }

    return name;
}

function updateGreeting() {
    const heading = document.querySelector(".welcome-copy h1");

    if (!heading) return;

    const hour = new Date().getHours();

    let greeting = "Good evening";

    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 17) {
        greeting = "Good afternoon";
    }

    heading.textContent = `${greeting}, ${getUserName()}!`;

    if (!document.querySelector("#edit-user-name")) {
        const button = document.createElement("button");

        button.id = "edit-user-name";
        button.type = "button";
        button.textContent = "Edit name";

        button.addEventListener("click", () => {
            const newName = prompt(
                "Enter your name:",
                localStorage.getItem(USER_KEY)
            );

            if (newName?.trim()) {
                localStorage.setItem(USER_KEY, newName.trim());
                updateGreeting();
            }
        });

        heading.insertAdjacentElement("afterend", button);
    }
}


function populatePlantSelect(select) {
    const customPlants = getCustomPlants();
    const allPlants = [...defaultPlants, ...customPlants];

    select.innerHTML = "";

    allPlants.forEach(plant => {
        const option = document.createElement("option");
        option.value = plant.id;
        option.textContent = plant.name;
        select.appendChild(option);
    });

    const savedPlant = localStorage.getItem(SELECTED_PLANT_KEY);

    const validPlant = allPlants.some(
        plant => plant.id === savedPlant
    );

    select.value = validPlant ? savedPlant : "tulsi";

    localStorage.setItem(SELECTED_PLANT_KEY, select.value);

    // Allow Plant Profile to render the restored selection.
    select.dispatchEvent(new Event("change"));

    select.addEventListener("change", () => {
        localStorage.setItem(SELECTED_PLANT_KEY, select.value);
    });
}


function addPlantButton(select) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = "+ Add plant";
    button.className = "plant-add-button";

    button.addEventListener("click", () => {
        const name = prompt("Enter your plant's name:");

        if (!name?.trim()) return;

        const cleanName = name.trim();

        const allPlants = [
            ...defaultPlants,
            ...getCustomPlants()
        ];

        const alreadyExists = allPlants.some(
            plant => plant.name.toLowerCase() === cleanName.toLowerCase()
        );

        if (alreadyExists) {
            alert("This plant already exists!");
            return;
        }

        const newPlant = {
            id: `custom-${Date.now()}`,
            name: cleanName
        };

        const customPlants = getCustomPlants();
        customPlants.push(newPlant);

        localStorage.setItem(
            PLANTS_KEY,
            JSON.stringify(customPlants)
        );

        // Update every plant selector on this page
        document.querySelectorAll("#plant-select").forEach(
            plantSelect => {
                populatePlantSelect(plantSelect);
                plantSelect.value = newPlant.id;
            }
        );

        localStorage.setItem(SELECTED_PLANT_KEY, newPlant.id);

        // Refresh profile content if the profile page is open
        document.querySelector("#plant-select")?.dispatchEvent(
            new Event("change")
        );
    });

    select.insertAdjacentElement("afterend", button);
}

document.addEventListener("DOMContentLoaded", () => {
    updateGreeting();

    document.querySelectorAll("#plant-select").forEach(select => {
        populatePlantSelect(select);
        addPlantButton(select);
    });
});
