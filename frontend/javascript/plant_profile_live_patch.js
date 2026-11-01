/* Add after plant_profile.js and main.js. Preserves the existing plant
   information/care UI and replaces only the sensor-reading renderer. */
(() => {
  "use strict";
  const API_URL = "http://127.0.0.1:5000/sensor-data?limit=1";
  const sensors = [
    { key: "soil", name: "Soil Moisture", unit: "%", convert: v => clamp((3295 - v) / (3295 - 1936) * 100, 0, 100) },
    { key: "temperature", name: "Temperature", unit: "°C", convert: v => v },
    { key: "humidity", name: "Humidity", unit: "%", convert: v => v },
    { key: "light", name: "Relative Light", unit: "%", convert: v => clamp((4095 - v) / (4095 - 2018) * 100, 0, 100) }
  ];
  const icons = {
    soil: '<path d="M16 4C12 11 7 16 7 21a9 9 0 0 0 18 0c0-5-5-10-9-17Z"/>',
    temperature: '<path d="M13 19V7a4 4 0 0 1 8 0v12a8 8 0 1 1-8 0Z"/>',
    humidity: '<path d="M8 24a6 6 0 0 1 0-12 9 9 0 0 1 17 3 5 5 0 0 1 0 9Z"/>',
    light: '<circle cx="16" cy="16" r="6"/>'
  };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const valid = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

  function unavailable(message) {
    const grid = document.querySelector("#readings-grid");
    if (!grid) return;
    grid.innerHTML = sensors.map(sensor => `
      <article class="profile-sensor-card ${sensor.key}">
        <span class="profile-sensor-icon" aria-hidden="true"><svg viewBox="0 0 32 32">${icons[sensor.key]}</svg></span>
        <span class="sensor-name">${sensor.name}</span>
        <strong class="sensor-value unavailable">Unavailable</strong>
        <span class="sensor-status">${message}</span>
      </article>`).join("");
    const label = document.querySelector(".readings-section .sample-label");
    if (label) label.textContent = message === "Waiting for sensor data" ? "Waiting for Data" : "Connection Unavailable";
  }

  function render(row) {
    const grid = document.querySelector("#readings-grid");
    if (!grid) return;
    grid.innerHTML = sensors.map(sensor => {
      const raw = row[sensor.key];
      const good = valid(raw);
      const value = good ? sensor.convert(Number(raw)) : null;
      return `<article class="profile-sensor-card ${sensor.key}">
        <span class="profile-sensor-icon" aria-hidden="true"><svg viewBox="0 0 32 32">${icons[sensor.key]}</svg></span>
        <span class="sensor-name">${sensor.name}</span>
        <strong class="sensor-value ${good ? "" : "unavailable"}">${good ? `${value.toFixed(1)} <small>${sensor.unit}</small>` : "Unavailable"}</strong>
        <span class="sensor-status">${good ? "Live device reading" : "Sensor value not received"}</span>
      </article>`;
    }).join("");
    const label = document.querySelector(".readings-section .sample-label");
    if (label) label.textContent = "Live Device Data";
  }

  let busy = false;
  async function refresh() {
    if (busy || !document.querySelector("#readings-grid")) return;
    busy = true;
    try {
      const response = await fetch(API_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length === 0) unavailable("Waiting for sensor data");
      else render(rows[0]);
    } catch (error) {
      console.error("FloraSense sensor connection:", error);
      unavailable("Backend connection unavailable");
    } finally { busy = false; }
  }
  // Override the original renderer so its existing 3-second polling keeps working.
  window.renderReadings = render;
  window.showUnavailableReadings = unavailable;
  document.addEventListener("DOMContentLoaded", refresh);
})();
