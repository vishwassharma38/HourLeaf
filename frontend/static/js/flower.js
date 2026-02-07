// flower.js
// Simulation Driver & Lifecycle Manager
// Phase 6.2: Orchestrator
//
// This file owns the simulation loop, time, and physics integration.
// It bridges the pure data (Flower) with the pure view (Renderer).

document.addEventListener("DOMContentLoaded", () => {
  if (!window.FLOWER_DATA) return;
  if (!window.Flower || !window.FlowerRenderer || !window.WindField) {
      if (!window.Flower) console.error("Module 'Flower' is missing.");
      if (!window.FlowerRenderer) console.error("Module 'FlowerRenderer' is missing.");
      if (!window.WindField) console.error("Module 'WindField' is missing.");
      return;
  }

  const canvas = document.getElementById("flower-canvas");
  if (!canvas) {
      console.error("Canvas not found");
      return;
  }

  // --- 1. System Initialization ---
  
  // A. The Subject (Physics State)
  const flower = new Flower(0, 0);
  
  // B. The Environment (Physics Context)
  const wind = new WindField();
  const gravity = new Vector2(0, 200.0); // Standard gravity
  
  // C. The View (Stateless Renderer)
  const renderer = new FlowerRenderer(canvas);


  // --- 2. Simulation Loop ---
  
  let lastTime = 0;
  let totalTime = 0;
  let animationId = null;

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;

    // Time handling
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1; // Cap dt for stability
    
    lastTime = timestamp;
    totalTime += dt;

    // A. Update Physics (The Truth)
    flower.update(dt, {
        gravity: gravity,
        wind: wind,
        time: totalTime
    });

    // B. Render Frame (The View)
    renderer.render(flower, totalTime);

    animationId = requestAnimationFrame(loop);
  }

  // Start the heartbeat
  animationId = requestAnimationFrame(loop);


  // --- 3. UI / Lifecycle Logic (Low Frequency) ---
  
  function refreshUI() {
    // Get pure state from window data (server state)
    const state = getFlowerState(window.FLOWER_DATA.plantedAt);
    
    // Update DOM UI (message)
    const messageEl = document.getElementById("flower-message");
    if (messageEl) {
        messageEl.innerText = state.message;
    }
  }

  // Initial UI update
  refreshUI();

  // Update UI every minute (simulation runs independently)
  setInterval(refreshUI, 60 * 1000);
});
