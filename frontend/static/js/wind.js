// wind.js
// Spatiotemporal Wind Field System
// Phase 5: Field-based environment
//
// This system replaces the global scalar wind with a continuous vector field.
// Wind is calculated as noise(x, y, t), creating unique forces for every point in space.

// --- 1. Compact Noise Implementation ---
// A minimal 2D noise implementation (Perlin-like) for spatiotemporal coherence.
// Based on standard permutation table approaches.

const PERM = new Uint8Array(512);
const P_MASK = 255;

(function initPermutation() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates shuffle
    for (let i = 255; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        [p[i], p[r]] = [p[r], p[i]];
    }
    // Double it for overflow handling
    for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }
function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : 0);
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

// 2D Noise function: noise(x, y)
// Returns value in range [-1, 1] approximately
function noise(x, y) {
    let X = Math.floor(x) & P_MASK;
    let Y = Math.floor(y) & P_MASK;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = fade(x);
    const v = fade(y);
    
    const A = PERM[X] + Y;
    const B = PERM[X + 1] + Y;
    
    return lerp(v, 
        lerp(u, grad(PERM[A], x, y), grad(PERM[B], x - 1, y)),
        lerp(u, grad(PERM[A + 1], x, y - 1), grad(PERM[B + 1], x - 1, y - 1))
    );
}

// --- 2. WindField Class ---

class WindField {
    constructor() {
        // Configuration for the "feel" of the wind
        this.baseSpeed = 15.0;     // Base magnitude of wind force
        this.gustiness = 20.0;     // Variability magnitude
        
        this.spatialScale = 0.005; // How quickly wind changes over distance
        this.timeScale = 0.5;      // How quickly wind patterns evolve
        
        // Offset to avoid 0,0 symmetries
        this.offset = { x: Math.random() * 1000, y: Math.random() * 1000 };
    }

    /**
     * Sample the wind field at a specific position and time.
     * @param {Vector2} pos - World position of the object (e.g., segment)
     * @param {number} time - Global simulation time in seconds
     * @returns {Vector2} Force vector to apply
     */
    getForce(pos, time) {
        // Domain transformation
        const nx = (pos.x + this.offset.x) * this.spatialScale;
        const ny = (pos.y + this.offset.y) * this.spatialScale;
        const nt = time * this.timeScale;

        // Sample noise for two components to get a vector
        // We offset time/space slightly for 'y' component to decouple them
        const noiseX = noise(nx + nt, ny); 
        const noiseY = noise(nx, ny + nt + 100); // +100 to decorrelate

        // Map noise [-1, 1] to wind vector
        // Main wind direction is usually horizontal, but we want turbulence
        
        // 1. Global Flow: Prevailing wind direction (e.g., slightly right)
        // const flow = 1.0; 
        
        // 2. Gusts: Noise-driven variation
        const forceX = (noiseX + 0.5) * (this.baseSpeed + this.gustiness * noiseY);
        // We bias X slightly positive to have a "prevailing wind" direction, 
        // but noiseX allows it to reverse or calm down.
        
        // Vertical wind (turbulence/lift) is usually weaker
        const forceY = noiseY * (this.gustiness * 0.3);

        return new Vector2(forceX, forceY);
    }
}

// Expose to global scope (since we aren't using ES6 modules for this project setup)
window.WindField = WindField;
