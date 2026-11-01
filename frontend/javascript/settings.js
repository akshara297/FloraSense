
"use strict";

// ---------------- ELEMENTS ----------------

const notificationStorageKey = "florasense-notification-preferences";

const profileForm = document.querySelector("#profile-form");
const profileFields = [...profileForm.querySelectorAll("input")];
const profileSubmit = document.querySelector("#save-profile");
const profileFeedback = document.querySelector("#profile-feedback");

const passwordForm = document.querySelector("#password-form");
const passwordFeedback = document.querySelector("#password-feedback");

const inAppToggle = document.querySelector("#in-app-enabled");
const browserToggle = document.querySelector("#browser-enabled");
const permissionStatus = document.querySelector("#browser-permission");
const browserHelp = document.querySelector("#browser-help");
const testNotificationButton = document.querySelector("#test-notification");
const notificationFeedback = document.querySelector("#notification-feedback");

const logoutButton = document.querySelector("#logout-button");
const logoutFeedback = document.querySelector("#logout-feedback");


// ---------------- API HELPER ----------------

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    return {
        ok: response.ok,
        status: response.status,
        data
    };
}


// ---------------- FEEDBACK ----------------

function setFeedback(element, message, tone = "") {
    element.textContent = message;
    element.className = `form-feedback${tone ? ` ${tone}` : ""}`;
}


// ---------------- LOAD AUTHENTICATED PROFILE ----------------

async function loadProfile() {
    try {
        const result = await apiRequest("/auth/me");

        if (result.status === 401) {
            window.location.replace("/");
            return;
        }

        if (!result.ok) {
            setFeedback(profileFeedback, "Unable to load your profile.", "error");
            return;
        }

        const user = result.data.user;

        document.querySelector("#profile-name").value = user.name;
        document.querySelector("#profile-username").value = user.username;
        document.querySelector("#profile-email").value = user.email;

        // Set the loaded values as the original values.
        profileFields.forEach(field => {
            field.defaultValue = field.value;
        });

        profileSubmit.disabled = true;

    } catch (error) {
        setFeedback(profileFeedback, "Unable to connect to the account service.", "error");
    }
}


// ---------------- PROFILE UPDATE ----------------

function updateProfileButton() {
    profileSubmit.disabled = !profileFields.some(
        field => field.value.trim() !== field.defaultValue
    );
}

profileFields.forEach(field => {
    field.addEventListener("input", updateProfileButton);
});

profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    setFeedback(profileFeedback, "");

    const invalidField = profileFields.find(
        field => !field.value.trim() || !field.validity.valid
    );

    if (invalidField) {
        setFeedback(
            profileFeedback,
            invalidField.type === "email"
                ? "Enter a valid email address."
                : "Complete all profile fields.",
            "error"
        );

        invalidField.focus();
        return;
    }

    profileSubmit.disabled = true;
    profileSubmit.textContent = "Saving...";

    const profile = {
        name: document.querySelector("#profile-name").value.trim(),
        username: document.querySelector("#profile-username").value.trim(),
        email: document.querySelector("#profile-email").value.trim()
    };

    try {
        const result = await apiRequest("/auth/profile", {
            method: "PUT",
            body: JSON.stringify(profile)
        });

        if (result.status === 401) {
            window.location.replace("/");
            return;
        }

        if (!result.ok) {
            setFeedback(
                profileFeedback,
                result.data.error || "Profile update failed.",
                "error"
            );
            return;
        }

        const updatedUser = result.data.user;

        document.querySelector("#profile-name").value = updatedUser.name;
        document.querySelector("#profile-username").value = updatedUser.username;
        document.querySelector("#profile-email").value = updatedUser.email;

        profileFields.forEach(field => {
            field.defaultValue = field.value;
        });

        setFeedback(profileFeedback, "Profile updated successfully.", "success");

    } catch (error) {
        setFeedback(profileFeedback, "Unable to connect to the account service.", "error");

    } finally {
        profileSubmit.textContent = "Save Changes";
        updateProfileButton();
    }
});


// ---------------- PASSWORD VISIBILITY ----------------

document.querySelectorAll(".password-toggle").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.passwordTarget);

        const showing = input.type === "password";
        input.type = showing ? "text" : "password";

        button.textContent = showing ? "Hide" : "Show";

        const fieldLabel = input.closest(".form-field")
            .childNodes[0].textContent.trim();

        button.setAttribute(
            "aria-label",
            `${showing ? "Hide" : "Show"} ${fieldLabel.toLowerCase()}`
        );

        button.setAttribute("aria-pressed", String(showing));
    });
});


// ---------------- CHANGE PASSWORD ----------------

passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const current = document.querySelector("#current-password");
    const next = document.querySelector("#new-password");
    const confirm = document.querySelector("#confirm-password");

    let message = "";

    if (!current.value || !next.value || !confirm.value) {
        message = "Enter your current password and complete both new password fields.";
    } else if (next.value.length < 8) {
        message = "Use at least 8 characters for the new password.";
    } else if (next.value.length > 128) {
        message = "New password must not exceed 128 characters.";
    } else if (next.value !== confirm.value) {
        message = "The new password and confirmation do not match.";
    }

    if (message) {
        setFeedback(passwordFeedback, message, "error");
        return;
    }

    const submitButton = passwordForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = "Updating...";

    try {
        const result = await apiRequest("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({
                currentPassword: current.value,
                newPassword: next.value
            })
        });

        if (result.status === 401) {
            window.location.replace("/");
            return;
        }

        if (!result.ok) {
            setFeedback(
                passwordFeedback,
                result.data.error || "Password update failed.",
                "error"
            );
            return;
        }

        passwordForm.reset();

        setFeedback(
            passwordFeedback,
            "Password changed successfully. Please log in again.",
            "success"
        );

        window.setTimeout(() => {
            window.location.replace("/");
        }, 1500);

    } catch (error) {
        setFeedback(
            passwordFeedback,
            "Unable to connect to the account service.",
            "error"
        );

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Update Password";
    }
});


// ---------------- LOGOUT ----------------

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutFeedback.textContent = "Logging out...";

    try {
        const result = await apiRequest("/auth/logout", {
            method: "POST"
        });

        if (!result.ok) {
            logoutFeedback.textContent = "Logout failed. Please try again.";
            logoutButton.disabled = false;
            return;
        }

        window.location.replace("/");

    } catch (error) {
        logoutFeedback.textContent = "Unable to connect to the server.";
        logoutButton.disabled = false;
    }
});


// ---------------- NOTIFICATION PREFERENCES ----------------

function readNotificationPreferences() {
    try {
        const preferences = JSON.parse(
            localStorage.getItem(notificationStorageKey) || "{}"
        );

        return {
            inAppEnabled: preferences.inAppEnabled !== false,
            browserEnabled: preferences.browserEnabled === true
        };

    } catch {
        return {
            inAppEnabled: true,
            browserEnabled: false
        };
    }
}


function saveNotificationPreferences(preferences) {
    try {
        localStorage.setItem(
            notificationStorageKey,
            JSON.stringify(preferences)
        );

        return true;

    } catch {
        return false;
    }
}


function renderNotificationPreferences() {
    const preferences = readNotificationPreferences();

    inAppToggle.checked = preferences.inAppEnabled;

    const supported = "Notification" in window;
    const permission = supported ? Notification.permission : "unsupported";

    browserToggle.disabled = !supported || permission === "denied";

    browserToggle.checked =
        supported &&
        permission === "granted" &&
        preferences.browserEnabled;

    testNotificationButton.disabled = !browserToggle.checked;

    permissionStatus.className = "permission-status";

    if (!supported) {
        permissionStatus.textContent = "Browser notifications: Unsupported";
        permissionStatus.classList.add("unsupported");

        browserHelp.textContent =
            "This browser does not support notifications.";

    } else if (permission === "granted") {
        permissionStatus.textContent = "Browser permission: Granted";
        permissionStatus.classList.add("granted");

        browserHelp.textContent = browserToggle.checked
            ? "Notifications are enabled in this browser."
            : "Permission is granted; turn on the switch to enable them.";

    } else if (permission === "denied") {
        permissionStatus.textContent = "Browser permission: Denied";
        permissionStatus.classList.add("denied");

        browserHelp.textContent =
            "Change this site's notification permission in your browser settings.";

    } else {
        permissionStatus.textContent = "Browser permission: Not granted";

        browserHelp.textContent =
            "Permission is requested only when you enable browser notifications.";
    }
}


// In-app notifications

inAppToggle.addEventListener("change", () => {
    const preferences = readNotificationPreferences();

    preferences.inAppEnabled = inAppToggle.checked;

    const saved = saveNotificationPreferences(preferences);

    notificationFeedback.textContent = saved
        ? "In-app preference updated in this browser and shared with Alerts."
        : "Browser storage is unavailable; this preference may not persist.";

    renderNotificationPreferences();
});


// Browser notifications

browserToggle.addEventListener("change", async () => {
    const current = readNotificationPreferences();

    if (!browserToggle.checked) {
        current.browserEnabled = false;

        const saved = saveNotificationPreferences(current);

        notificationFeedback.textContent = saved
            ? "Browser notifications are off."
            : "Browser storage is unavailable; this preference may not persist.";

        renderNotificationPreferences();
        return;
    }

    let permission = Notification.permission;

    if (permission === "default") {
        try {
            permission = await Notification.requestPermission();
        } catch {
            permission = "default";
        }
    }

    current.browserEnabled = permission === "granted";

    const saved = saveNotificationPreferences(current);

    notificationFeedback.textContent =
        permission === "granted"
            ? saved
                ? "Browser notifications are enabled in this browser."
                : "Permission granted, but the preference could not be saved."
            : permission === "denied"
                ? "Permission was denied. You can change it in your browser settings."
                : "Permission was not granted.";

    renderNotificationPreferences();
});


// Test notification

testNotificationButton.addEventListener("click", () => {
    if (
        !("Notification" in window) ||
        Notification.permission !== "granted" ||
        !browserToggle.checked
    ) {
        return;
    }

    try {
        new Notification("FloraSense test notification", {
            body: "Browser notifications are enabled for this site."
        });

        notificationFeedback.textContent =
            "Test notification sent to this browser.";

    } catch {
        notificationFeedback.textContent =
            "The browser could not display a notification.";
    }
});


// Keep preferences synchronized with Alerts page

window.addEventListener("storage", (event) => {
    if (event.key === notificationStorageKey) {
        renderNotificationPreferences();
    }
});


// ---------------- INITIALIZATION ----------------

renderNotificationPreferences();
loadProfile();
