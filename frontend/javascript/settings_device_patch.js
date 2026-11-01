/* Add after settings.js. Keeps existing local notification preferences and
   adds a truthful live ESP32 connection/readings panel to Settings. */
(() => {
  "use strict";
  const API_URL = "/sensor-data?limit=1";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const sensors=[
    {key:"soil",name:"Soil moisture",unit:"%",convert:v=>clamp((3295-v)/(3295-1936)*100,0,100)},
    {key:"temperature",name:"Temperature",unit:"°C",convert:v=>v},
    {key:"humidity",name:"Humidity",unit:"%",convert:v=>v},
    {key:"light",name:"Relative light",unit:"%",convert:v=>clamp((4095-v)/(4095-2018)*100,0,100)}
  ];
  function disableUnconnectedAccountActions() {
    // Authentication is now connected through the Flask backend.
}
  function addPanel(){const parent=document.querySelector(".settings-sections");if(!parent||document.querySelector("#device-status-card"))return;const card=document.createElement("section");card.className="settings-card";card.id="device-status-card";card.innerHTML='<div class="settings-section-heading"><span class="settings-section-icon" aria-hidden="true">●</span><div><h2>ESP32 Device Status</h2><p>Live connection and latest sensor values.</p></div></div><p id="device-connection-status" aria-live="polite">Checking connection…</p><div class="field-grid" id="device-reading-values"></div><p class="preference-note">Soil moisture and relative light are calculated from the raw ADC readings using the calibration values measured for this sensor setup. Relative light is not lux.</p>';parent.prepend(card);}
  async function refresh(){const status=document.querySelector("#device-connection-status"),grid=document.querySelector("#device-reading-values");if(!grid)return;try{const response=await fetch(API_URL,{cache:"no-store"});if(!response.ok)throw Error(`API ${response.status}`);const rows=await response.json();if(!rows.length){status.textContent="Backend connected — waiting for the first ESP32 reading.";grid.innerHTML="";return;}const row=rows[0];const timestamp=new Date(row.timestamp);status.textContent=`Connected · Latest reading: ${Number.isNaN(timestamp.getTime())?"time unavailable":timestamp.toLocaleString()}`;grid.innerHTML=sensors.map(s=>{const raw=row[s.key];const valid=raw!==null&&raw!==undefined&&raw!==""&&Number.isFinite(Number(raw));return `<div class="form-field"><span>${s.name}</span><strong>${valid?`${s.convert(Number(raw)).toFixed(1)} ${s.unit}`:"Sensor unavailable"}</strong></div>`;}).join("");}catch(error){console.error("Settings device status:",error);status.textContent = "Unable to connect to the sensor data service. Please try again.";grid.innerHTML="";}}
  document.addEventListener("DOMContentLoaded",()=>{disableUnconnectedAccountActions();addPanel();refresh();window.setInterval(refresh,5000);});
})();
