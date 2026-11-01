
(() => {
  "use strict";

  const BASE_URL = "http://127.0.0.1:5000";
  const SENSOR_URL = `${BASE_URL}/sensor-data?limit=1`;
  const ALERTS_URL = `${BASE_URL}/alerts`;
  const SUMMARY_URL = `${BASE_URL}/alerts/summary`;

  const $ = selector => document.querySelector(selector);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const prefsKey = "florasense-notification-preferences";
  const readKey = "florasense-read-alerts";

  const sensors = [
    {
      key: "soil",
      label: "Soil Moisture",
      unit: "%",
      convert: v => clamp((3295 - v) / (3295 - 1936) * 100, 0, 100)
    },
    {
      key: "temperature",
      label: "Temperature",
      unit: "°C",
      convert: v => v
    },
    {
      key: "humidity",
      label: "Humidity",
      unit: "%",
      convert: v => v
    },
    {
      key: "light",
      label: "Relative Light",
      unit: "%",
      convert: v => clamp((4095 - v) / (4095 - 2018) * 100, 0, 100)
    }
  ];

  const thresholds = [
    ["Soil Moisture", "40–60 %"],
    ["Temperature", "20–30 °C"],
    ["Humidity", "40–70 %"],
    ["Relative Light", "50–80 %"]
  ];

  let allAlerts = [];
  let knownAlertIds = null;
  let activeStatus = "all";
  let activeSeverity = "all";
  let preferences = {};
  let readAlerts = [];

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function loadPreferences() {
    try {
      preferences = JSON.parse(localStorage.getItem(prefsKey) || "{}");
      readAlerts = JSON.parse(localStorage.getItem(readKey) || "[]");
      if (!Array.isArray(readAlerts)) readAlerts = [];
    } catch {
      preferences = {};
      readAlerts = [];
    }
  }

  function savePreferences() {
    localStorage.setItem(prefsKey, JSON.stringify(preferences));
  }

  function saveReadAlerts() {
    localStorage.setItem(readKey, JSON.stringify(readAlerts));
  }

  function setupPlant() {
    const select = $("#plant-select");
    if (!select) return;

    select.replaceChildren();

    const option = document.createElement("option");
    option.value = "tulsi";
    option.textContent = "Tulsi";
    select.appendChild(option);

    select.value = "tulsi";
    select.disabled = true;

    localStorage.setItem("floraSenseSelectedPlant", "tulsi");
  }

  function setupThresholds() {
    const panel = $(".threshold-panel");
    if (!panel) return;

    const note = panel.querySelector(".threshold-note");
    const list = panel.querySelector(".threshold-list");

    if (note) {
      note.textContent = "Configured working ranges for Tulsi. Light is a relative LDR percentage, not lux.";
    }

    if (list) {
      list.innerHTML = thresholds.map(([label, range]) =>
        `<li><span>${label}</span><strong>${range}</strong></li>`
      ).join("");
    }
  }

  function setupLiveLabel() {
    const meta = $(".alerts-meta");
    if (!meta) return;

    const label = meta.querySelector(".sample-label");
    const description = meta.querySelector("span:last-child");

    if (label) label.textContent = "Live Data";
    if (description) {
      description.textContent = "Alerts are generated from actual ESP32 sensor readings.";
    }
  }

  function addDevicePanel() {
    const threshold = $(".threshold-panel");

    if (!threshold || $("#alert-device-readings")) return;

    const section = document.createElement("section");
    section.className = "threshold-panel";
    section.id = "alert-device-readings";

    section.innerHTML = `
      <div class="list-heading">
        <div>
          <p class="eyebrow">LIVE ESP32 DATA</p>
          <h2>Current Device Readings</h2>
        </div>
        <span class="sample-label" id="alert-device-status">Connecting…</span>
      </div>
      <p class="threshold-note">
        Live readings from the connected ESP32. These readings are checked against Tulsi's working ranges.
      </p>
      <ul class="threshold-list" id="alert-reading-list">
        <li>Waiting for sensor data…</li>
      </ul>
    `;

    threshold.insertAdjacentElement("afterend", section);
  }

  async function refreshReadings() {
    const status = $("#alert-device-status");
    const list = $("#alert-reading-list");

    if (!list) return;

    try {
      const response = await fetch(SENSOR_URL, { cache: "no-store" });

      if (!response.ok) throw new Error(`API ${response.status}`);

      const rows = await response.json();

      if (!Array.isArray(rows) || !rows.length) {
        list.innerHTML = "<li>No sensor readings received yet.</li>";
        if (status) status.textContent = "Waiting for Data";
        return;
      }

      const row = rows[0];

      list.innerHTML = sensors.map(sensor => {
        const raw = row[sensor.key];

        const valid =
          raw !== null &&
          raw !== undefined &&
          raw !== "" &&
          Number.isFinite(Number(raw));

        const value = valid ? sensor.convert(Number(raw)) : null;

        return `
          <li>
            <span>${sensor.label}</span>
            <strong>${valid ? `${value.toFixed(1)} ${sensor.unit}` : "Unavailable"}</strong>
          </li>
        `;
      }).join("");

      if (status) status.textContent = "Live device data";

    } catch (error) {
      console.error("Sensor API:", error);
      list.innerHTML = "<li>Backend connection unavailable.</li>";
      if (status) status.textContent = "Offline";
    }
  }

  function updateSummary(summary) {
    const grid = $("#summary-grid");
    if (!grid) return;

    const entries = [
      ["Critical Alerts", summary.critical, "critical", "!"],
      ["Warning Alerts", summary.warning, "warning", "⌁"],
      ["Resolved Alerts", summary.resolved, "resolved", "✓"],
      ["Total Alerts", summary.total, "total", "◷"]
    ];

    grid.innerHTML = entries.map(([label, count, tone, icon]) => `
      <article class="summary-card ${tone}">
        <span class="summary-icon" aria-hidden="true">${icon}</span>
        <span class="summary-count">${count}</span>
        <span class="summary-label">${label}</span>
      </article>
    `).join("");
  }

  function formatDate(value) {
    if (!value) return "Time unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Time unavailable";

    return date.toLocaleString();
  }

  function renderAlerts() {
    const list = $("#alert-list");
    if (!list) return;

    let filtered = allAlerts;

    if (activeStatus !== "all") {
      filtered = filtered.filter(alert => alert.status === activeStatus);
    }

    if (activeSeverity !== "all") {
      filtered = filtered.filter(alert => alert.severity === activeSeverity);
    }

    if (!filtered.length) {
      list.innerHTML = `
        <div class="empty-state">
          <span aria-hidden="true">✿</span>
          <h3>No alerts found</h3>
          <p>No alerts match the selected filters.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(alert => `
      <article class="alert-card ${escapeHTML(alert.severity)} ${escapeHTML(alert.status)}">
        <div class="alert-card-content">
          <span class="alert-severity">${escapeHTML(alert.severity)}</span>
          <h3>${escapeHTML(alert.title)}</h3>
          <p>${escapeHTML(alert.message)}</p>
          <small>${escapeHTML(formatDate(alert.created_at))}</small>
          <span class="alert-status">${escapeHTML(alert.status)}</span>
        </div>
        <button type="button" class="text-button view-alert" data-alert-id="${Number(alert.id)}">
          View details
        </button>
      </article>
    `).join("");

    list.querySelectorAll(".view-alert").forEach(button => {
      button.addEventListener("click", () => {
        const alert = allAlerts.find(
          item => Number(item.id) === Number(button.dataset.alertId)
        );

        if (alert) showAlertDetails(alert);
      });
    });
  }

  function updateNotifications() {
    const unread = allAlerts.filter(
      alert => alert.status === "active" && !readAlerts.includes(Number(alert.id))
    );

    const badge = $("#unread-count");
    const summary = $("#notification-summary");
    const list = $("#notification-list");

    if (badge) {
      badge.textContent = String(unread.length);
      badge.hidden = unread.length === 0;
    }

    if (summary) {
      summary.textContent = `${unread.length} unread notification${unread.length === 1 ? "" : "s"}`;
    }

    if (!list) return;

    if (preferences.inAppEnabled === false) {
      list.innerHTML = '<p class="notification-empty">In-app notifications are turned off.</p>';
      return;
    }

    if (!unread.length) {
      list.innerHTML = '<p class="notification-empty">No unread notifications.</p>';
      return;
    }

    list.innerHTML = unread.map(alert => `
      <article class="notification-item">
        <strong>${escapeHTML(alert.title)}</strong>
        <p>${escapeHTML(alert.message)}</p>
        <small>${escapeHTML(formatDate(alert.created_at))}</small>
      </article>
    `).join("");
  }

  function showAlertDetails(alert) {
    const dialog = $("#alert-dialog");
    if (!dialog) return;

    const title = $("#detail-title");
    const content = $("#alert-detail-content");
    const actions = $("#detail-actions");

    if (title) title.textContent = alert.title;

    if (content) {
      content.innerHTML = `
        <p>${escapeHTML(alert.message)}</p>
        <p><strong>Current reading:</strong> ${escapeHTML(alert.value)} ${escapeHTML(alert.unit)}</p>
        <p><strong>Severity:</strong> ${escapeHTML(alert.severity)}</p>
        <p><strong>Status:</strong> ${escapeHTML(alert.status)}</p>
        <p><strong>Created:</strong> ${escapeHTML(formatDate(alert.created_at))}</p>
        ${alert.resolved_at
          ? `<p><strong>Resolved:</strong> ${escapeHTML(formatDate(alert.resolved_at))}</p>`
          : ""}
      `;
    }

    if (actions) {
      actions.innerHTML = `
        <button type="button" class="secondary-button" id="close-alert-detail">
          Close
        </button>
      `;

      $("#close-alert-detail")?.addEventListener("click", () => dialog.close());
    }

    if (!dialog.open) dialog.showModal();
  }

  async function refreshAlerts() {
    try {
      const [alertsResponse, summaryResponse] = await Promise.all([
        fetch(ALERTS_URL, { cache: "no-store" }),
        fetch(SUMMARY_URL, { cache: "no-store" })
      ]);

      if (!alertsResponse.ok || !summaryResponse.ok) {
        throw new Error("Could not fetch alerts");
      }

      const alerts = await alertsResponse.json();
      const summary = await summaryResponse.json();

      if (!Array.isArray(alerts)) throw new Error("Invalid alerts response");

      // Detect newly generated alerts without notifying about old history.
      if (knownAlertIds === null) {
        knownAlertIds = new Set(alerts.map(alert => Number(alert.id)));
      } else {
        const newAlerts = alerts.filter(
          alert => !knownAlertIds.has(Number(alert.id))
        );

        newAlerts.forEach(alert => {
          knownAlertIds.add(Number(alert.id));
          sendBrowserNotification(alert);
        });
      }

      allAlerts = alerts;

      updateSummary(summary);
      renderAlerts();
      updateNotifications();

    } catch (error) {
      console.error("Alerts API:", error);

      const list = $("#alert-list");

      if (list && !allAlerts.length) {
        list.innerHTML = `
          <div class="empty-state">
            <h3>Unable to load alerts</h3>
            <p>Check whether the FloraSense backend is running.</p>
          </div>
        `;
      }
    }
  }

  function sendBrowserNotification(alert) {
    if (
      preferences.browserEnabled !== true ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) return;

    try {
      new Notification(alert.title, {
        body: alert.message
      });
    } catch (error) {
      console.error("Browser notification:", error);
    }
  }

  function setupFilters() {
    document.querySelectorAll("[data-status-filter]").forEach(button => {
      button.addEventListener("click", () => {
        activeStatus = button.dataset.statusFilter;

        document.querySelectorAll("[data-status-filter]").forEach(item => {
          item.setAttribute(
            "aria-pressed",
            String(item === button)
          );
        });

        renderAlerts();
      });
    });

    $("#severity-filter")?.addEventListener("change", event => {
      activeSeverity = event.target.value;
      renderAlerts();
    });
  }

  function setupNotifications() {
    const trigger = $("#notification-trigger");
    const panel = $("#notification-panel");

    trigger?.addEventListener("click", () => {
      if (!panel) return;

      panel.hidden = !panel.hidden;
      trigger.setAttribute("aria-expanded", String(!panel.hidden));
    });

    $("#mark-all-read")?.addEventListener("click", () => {
      readAlerts = allAlerts
        .filter(alert => alert.status === "active")
        .map(alert => Number(alert.id));

      saveReadAlerts();
      updateNotifications();
    });
  }

  function setupSettings() {
    const dialog = $("#settings-dialog");
    const inApp = $("#in-app-enabled");
    const browser = $("#browser-enabled");
    const browserStatus = $("#browser-status");
    const feedback = $("#settings-feedback");

    if (!dialog) return;

    if (inApp) inApp.checked = preferences.inAppEnabled !== false;
    if (browser) browser.checked = preferences.browserEnabled === true;

    function updateBrowserStatus() {
      if (!browserStatus) return;

      if (!("Notification" in window)) {
        browserStatus.textContent = "Browser notifications are not supported.";
      } else {
        browserStatus.textContent = `Permission: ${Notification.permission}`;
      }
    }

    updateBrowserStatus();

    $("#open-settings")?.addEventListener("click", () => {
      if (!dialog.open) dialog.showModal();
    });

    dialog.querySelector(".close-dialog")?.addEventListener("click", () => {
      dialog.close();
    });

    inApp?.addEventListener("change", () => {
      preferences.inAppEnabled = inApp.checked;
      savePreferences();
      updateNotifications();
    });

    browser?.addEventListener("change", async () => {
      if (!browser.checked) {
        preferences.browserEnabled = false;
        savePreferences();
        updateBrowserStatus();
        return;
      }

      if (!("Notification" in window)) {
        browser.checked = false;
        if (feedback) feedback.textContent = "This browser does not support notifications.";
        return;
      }

      try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          preferences.browserEnabled = true;
          if (feedback) feedback.textContent = "Browser notifications enabled.";
        } else {
          preferences.browserEnabled = false;
          browser.checked = false;
          if (feedback) feedback.textContent = "Browser notification permission was not granted.";
        }

        savePreferences();
        updateBrowserStatus();

      } catch (error) {
        browser.checked = false;
        if (feedback) feedback.textContent = "Could not enable browser notifications.";
      }
    });
  }

  function setupDialogs() {
    document.querySelectorAll(".app-dialog .close-dialog").forEach(button => {
      button.addEventListener("click", () => {
        button.closest("dialog")?.close();
      });
    });
  }

  async function initialize() {
    loadPreferences();
    setupPlant();
    setupThresholds();
    setupLiveLabel();
    addDevicePanel();
    setupFilters();
    setupNotifications();
    setupSettings();
    setupDialogs();

    await Promise.all([
      refreshReadings(),
      refreshAlerts()
    ]);

    window.setInterval(refreshReadings, 5000);
    window.setInterval(refreshAlerts, 5000);
  }

  initialize();
})();
