(() => {
  "use strict";
  const API_URL = "/sensor-data?limit=2000";
  const cards = [...document.querySelectorAll("[data-chart]")];
  const note = document.getElementById("period-note");
  const select = document.getElementById("plant-select");
  const image = document.getElementById("selected-plant-image");
  const periods = { "24h": 24, "7d": 168, "30d": 720 };
  const sensors = [
    { key: "soilMoisture", source: "soil", title: "Soil moisture", unit: "%", max: 100, step: 20, color: "#28743b", convert: v => clamp((3295-v)/(3295-1936)*100,0,100) },
    { key: "temperature", source: "temperature", title: "Temperature", unit: "°C", max: 50, step: 10, color: "#df4b19", convert: v => v },
    { key: "humidity", source: "humidity", title: "Humidity", unit: "%", max: 100, step: 20, color: "#1386c4", convert: v => v },
    { key: "lightIntensity", source: "light", title: "Relative light", unit: "%", max: 100, step: 20, color: "#e99b00", convert: v => clamp((4095-v)/(4095-2018)*100,0,100) }
  ];
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  let allRows = [];
  let period = "7d";
  let busy = false;

  function populatePlants() {
    if (!select) return;
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem("floraSenseCustomPlants") || "[]"); } catch {}
    const saved = localStorage.getItem("floraSenseSelectedPlant") || select.value || "tulsi";
    const defaults = [{id:"tulsi",name:"Tulsi"},{id:"aloe",name:"Aloe Vera"},{id:"rose",name:"Rose"},{id:"cactus",name:"Cactus"}];
    const plants = [...defaults, ...custom.filter(p => p && p.id && p.name)];
    select.replaceChildren(...plants.map(p => { const o=document.createElement("option"); o.value=p.id; o.textContent=p.name; return o; }));
    select.value = plants.some(p=>p.id===saved) ? saved : "tulsi";
  }
  function rowsForPeriod() {
    const cutoff = Date.now() - periods[period] * 3600000;
    return allRows.filter(row => row.timestamp && row.timestamp.getTime() >= cutoff).sort((a,b)=>a.timestamp-b.timestamp);
  }
  function fmt(v,s) { return `${s.key === "temperature" ? v.toFixed(1) : Math.round(v)}${s.unit}`; }
  function statsMarkup(rows,s) {
    const vals = rows.map(r=>r[s.key]).filter(Number.isFinite);
    if (!vals.length) return '<div class="empty-chart">No valid readings available.</div>';
    const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
    return [["Latest",vals[vals.length-1]],["Average",avg],["Minimum",Math.min(...vals)],["Maximum",Math.max(...vals)]]
      .map(([label,value])=>`<div class="stat"><span>${label}</span><strong>${fmt(value,s)}</strong></div>`).join("");
  }
  function renderChart(target,rows,s) {
    if (!rows.length) { target.innerHTML='<div class="empty-chart">No real readings recorded in this period.</div>'; return; }
    const w=520,h=180,m={top:12,right:13,bottom:30,left:48},pw=w-m.left-m.right,ph=h-m.top-m.bottom;
    const x=i=>m.left+(rows.length===1?pw/2:i/(rows.length-1)*pw), y=v=>m.top+ph-v/s.max*ph;
    const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    let out=[];
    for(let t=0;t<=s.max;t+=s.step){const yy=y(t);out.push(`<line x1="${m.left}" x2="${w-m.right}" y1="${yy}" y2="${yy}" class="gridline"/><text x="${m.left-8}" y="${yy+3}" text-anchor="end">${t}</text>`);}
    const labels=rows.length<=7?rows.map((_,i)=>i):[0,Math.round((rows.length-1)/3),Math.round((rows.length-1)*2/3),rows.length-1];
    [...new Set(labels)].forEach(i=>out.push(`<text x="${x(i)}" y="${h-8}" text-anchor="middle">${esc(rows[i].timestamp.toLocaleDateString([],period==="24h"?{hour:"numeric",minute:"2-digit"}:{month:"short",day:"numeric"}))}</text>`));
    out.push(`<line x1="${m.left}" x2="${m.left}" y1="${m.top}" y2="${h-m.bottom}" class="axisline"/><line x1="${m.left}" x2="${w-m.right}" y1="${h-m.bottom}" y2="${h-m.bottom}" class="axisline"/>`);
    const points=rows.map((r,i)=>`${x(i)},${y(clamp(r[s.key],0,s.max))}`).join(" ");
    out.push(`<polyline points="${points}" class="line"/>`);
    rows.forEach((r,i)=>out.push(`<circle cx="${x(i)}" cy="${y(clamp(r[s.key],0,s.max))}" r="${rows.length>40?2.2:3.8}" class="point"><title>${esc(s.title)}: ${esc(fmt(r[s.key],s))} at ${esc(r.timestamp.toLocaleString())}</title></circle>`));
    target.innerHTML=`<svg class="trend-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${s.title} based on ESP32 readings">${out.join("")}</svg>`;
  }
  function render() {
    const rows=rowsForPeriod();
    const imageMap={tulsi:"../assets/images/tulsi_botanical.png",aloe:"../assets/images/asset1_2.png",rose:"../assets/images/asset1_2.png",cactus:"../assets/images/asset1_2.png"};
    if(image&&select){image.src=imageMap[select.value]||"../assets/images/asset1_2.png";image.alt=`${select.selectedOptions[0]?.textContent||"Selected"} plant`;}
    const label={"24h":"24 hours","7d":"7 days","30d":"30 days"}[period];
    if(note) note.textContent=`Showing ${rows.length} actual device readings within ${label}. Readings are not assigned to individual plants.`;
    cards.forEach((card,i)=>{const s=sensors[i];if(!s)return;const plot=card.querySelector("[data-chart-plot]");const stats=card.querySelector("[data-stats]");renderChart(plot,rows.filter(r=>Number.isFinite(r[s.key])),s);stats.innerHTML=statsMarkup(rows.filter(r=>Number.isFinite(r[s.key])),s);});
  }
  async function load() {
    if(busy)return;busy=true;
    try{
      const res=await fetch(API_URL,{cache:"no-store"});if(!res.ok)throw new Error(`API ${res.status}`);
      const data=await res.json();
      allRows=Array.isArray(data)?data.map(row=>{
        const date=new Date(row.timestamp);
        const result={timestamp:date};
        sensors.forEach(s=>{const raw=row[s.source];result[s.key]=raw===null||raw===undefined||raw===""?null:Number(raw);if(Number.isFinite(result[s.key]))result[s.key]=s.convert(result[s.key]);else result[s.key]=null;});
        return result;
      }).filter(r=>!Number.isNaN(r.timestamp.getTime())):[];
      document.querySelector(".trends-meta .sample-label")?.replaceChildren("Live Device History");
    }catch(err){console.error("Trends API error:",err);allRows=[];document.querySelector(".trends-meta .sample-label")?.replaceChildren("Connection Unavailable");}
    finally{busy=false;render();}
  }
  populatePlants();
  document.querySelectorAll("[data-period]").forEach(button=>button.addEventListener("click",()=>{period=button.dataset.period;document.querySelectorAll("[data-period]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));render();}));
  select?.addEventListener("change",()=>{localStorage.setItem("floraSenseSelectedPlant",select.value);render();});
  load();window.setInterval(load,10000);
})();

