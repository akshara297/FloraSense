
"use strict";

// ---------------- ELEMENTS ----------------

const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");

const loginView = document.querySelector("#login-view");
const signupView = document.querySelector("#signup-view");

const loginFeedback = document.querySelector("#login-feedback");
const signupFeedback = document.querySelector("#signup-feedback");

const showSignupButton = document.querySelector("#show-signup");
const showLoginButton = document.querySelector("#show-login");

const loginButton = loginForm.querySelector('button[type="submit"]');
const signupButton = signupForm.querySelector('button[type="submit"]');

let loginInProgress = false;
let signupInProgress = false;

const API_URL = "";

// ---------------- FEEDBACK ----------------

function showLoginMessage(message, isError = false) {
    loginFeedback.textContent = message;
    loginFeedback.classList.toggle("is-error", isError);
}

function showSignupMessage(message, isError = false) {
    signupFeedback.textContent = message;
    signupFeedback.classList.toggle("is-error", isError);
}

function clearMessages() {
    showLoginMessage("");
    showSignupMessage("");
}

// ---------------- VIEW SWITCHING ----------------

function showLoginView() {
    loginView.hidden = false;
    signupView.hidden = true;

    clearMessages();
}

function showSignupView() {
    loginView.hidden = true;
    signupView.hidden = false;

    clearMessages();
}

showSignupButton.addEventListener("click", showSignupView);
showLoginButton.addEventListener("click", showLoginView);

// ---------------- REDIRECT ----------------

function redirectToDashboard() {
    window.location.assign("/pages/dashboard.html");
}

// ---------------- API HELPER ----------------

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(API_URL + endpoint, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const result = await response.json().catch(() => ({}));

    return {
        ok: response.ok,
        status: response.status,
        data: result
    };
}

// ---------------- LOGIN ----------------

async function handleLoginSubmit(event) {
    event.preventDefault();

    if (loginInProgress) return;

    clearMessages();

    if (!loginForm.reportValidity()) return;

    loginInProgress = true;
    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    const remember = document.querySelector("#remember").checked;

    try {
        const result = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password,
                remember
            })
        });

        if (!result.ok) {
            showLoginMessage(
                result.data.error || "Login failed. Please check your details.",
                true
            );
            return;
        }

        showLoginMessage("Login successful! Opening your dashboard...");

        redirectToDashboard();

    } catch (error) {
        showLoginMessage(
            "Unable to connect to FloraSense. Please check whether the server is running.",
            true
        );
    } finally {
        loginInProgress = false;
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
}

// ---------------- SIGNUP ----------------

async function handleSignupSubmit(event) {
    event.preventDefault();

    if (signupInProgress) return;

    clearMessages();

    if (!signupForm.reportValidity()) return;

    const name = document.querySelector("#signup-name").value.trim();
    const username = document.querySelector("#signup-username").value.trim();
    const email = document.querySelector("#signup-email").value.trim();
    const password = document.querySelector("#signup-password").value;
    const confirmPassword = document.querySelector("#confirm-signup-password").value;

    if (password !== confirmPassword) {
        showSignupMessage("Passwords do not match.", true);
        return;
    }

    signupInProgress = true;
    signupButton.disabled = true;
    signupButton.textContent = "Creating account...";

    try {
        const result = await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                name,
                username,
                email,
                password
            })
        });

        if (!result.ok) {
            showSignupMessage(
                result.data.error || "Account creation failed. Please try again.",
                true
            );
            return;
        }

        signupForm.reset();

        document.querySelector("#email").value = email;

        showLoginView();

        showLoginMessage(
            "Account created successfully! Please log in to continue."
        );

    } catch (error) {
        showSignupMessage(
            "Unable to connect to FloraSense. Please check whether the server is running.",
            true
        );
    } finally {
        signupInProgress = false;
        signupButton.disabled = false;
        signupButton.textContent = "Create Account";
    }
}

// ---------------- EVENT LISTENERS ----------------

loginForm.addEventListener("submit", handleLoginSubmit);
signupForm.addEventListener("submit", handleSignupSubmit);

loginForm.addEventListener("input", () => {
    if (loginFeedback.textContent) showLoginMessage("");
});

signupForm.addEventListener("input", () => {
    if (signupFeedback.textContent) showSignupMessage("");
});

// ---------------- EXISTING SESSION CHECK ----------------

async function checkExistingSession() {
    try {
        const result = await apiRequest("/auth/me");

        if (result.ok) {
            redirectToDashboard();
        }
    } catch (error) {
        // If the server is unavailable, keep the login page visible.
    }
}

checkExistingSession();
