// renderer.js
// Handles the HTML5 Canvas setup and drawing only.
// Phase 7: Environmental Context (Visuals Only)
//
// This module owns NO physics, NO time, and NO environment logic.
// It accepts a snapshot of a Flower + external Time and paints the scene.

const VISUAL_CONFIG = {
  GROUND_Y_OFFSET: 50,
};

class FlowerRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.width = 0;
    this.height = 0;

    // Bind resize to window, but render is explicit
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    this.ctx.scale(dpr, dpr);
  }

  /**
   * Main Entry Point: Renders a single frame of the flower.
   * @param {Flower} flower - The simulation state to render
   * @param {number} time - Global simulation time (for ambient effects)
   */
  render(flower, time = 0) {
    if (!flower) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Environmental Context (Background)
    // We draw this before translation so it fills the screen easily
    this.drawBackground(time);

    this.ctx.save();
    this.ctx.translate(
      this.width / 2,
      this.height - VISUAL_CONFIG.GROUND_Y_OFFSET,
    );

    // 2. Ground Plane
    this.drawGround();

    // 3. Organism Shadows
    this.drawShadow(flower);

    // 4. Structural Rendering
    this.drawStem(flower);
    this.drawPetals(flower);

    this.ctx.restore();
    
    // Pass flower for debug stats if needed
    this.drawDebugStats(flower);
  }

  drawBackground(time) {
    // Subtle vertical gradient
    // We drift the hue extremely slowly based on time to simulate "day/light" shifts
    // Time scale is dampened heavily so it's not disco mode.
    const hueDrift = Math.sin(time * 0.05) * 10; 
    
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, `hsl(${210 + hueDrift}, 30%, 90%)`); // Sky top
    grad.addColorStop(1, `hsl(${220 + hueDrift}, 20%, 95%)`); // Horizon

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawGround() {
    // Minimal grounding cue
    // Just a subtle darker plane below the stem origin
    this.ctx.fillStyle = "rgba(100, 100, 100, 0.05)";
    this.ctx.fillRect(-this.width / 2, 0, this.width, VISUAL_CONFIG.GROUND_Y_OFFSET);
    
    // Horizon line hint
    this.ctx.beginPath();
    this.ctx.moveTo(-this.width / 2, 0);
    this.ctx.lineTo(this.width / 2, 0);
    this.ctx.strokeStyle = "rgba(0,0,0,0.05)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  drawShadow(flower) {
    // Shadow grows with the flower's structural age (size proxy)
    // It stays grounded at (0,0) because the root is fixed.
    const size = 20 + Math.min(flower.structuralAge * 10, 60);
    const opacity = Math.min(0.1 + flower.structuralAge * 0.02, 0.25);

    const grad = this.ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, size);
    grad.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0.0)");
    
    this.ctx.fillStyle = grad;
    this.ctx.save();
    this.ctx.scale(1, 0.3); // Flatten to oval
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawStem(flower) {
    const segments = flower.segments;
    if (segments.length < 2) return;

    // A. DATA ANALYSIS
    const loadMap = computeLoadMap(segments);

    // B. GEOMETRY GENERATION
    const ribbon = computeStemGeometry(segments, loadMap, flower.structuralAge);

    // C. RENDERING
    const stemGrad = this.ctx.createLinearGradient(-15, 0, 15, 0); 
    stemGrad.addColorStop(0.0, "#4d7c43"); 
    stemGrad.addColorStop(0.4, "#6abf69"); 
    stemGrad.addColorStop(1.0, "#3e663a"); 
    
    this.ctx.fillStyle = stemGrad;
    this.ctx.beginPath();
    
    // Left side (up)
    drawSpline(this.ctx, ribbon.leftPoints);
    
    // Cap (Left tip to Right tip)
    const tipR = ribbon.rightPoints[ribbon.rightPoints.length - 1];
    this.ctx.lineTo(tipR.x, tipR.y);
    
    // Right side (down) - reverse points
    drawSpline(this.ctx, [...ribbon.rightPoints].reverse());
    
    this.ctx.closePath();
    this.ctx.fill();
    
    // Subtle outline
    this.ctx.strokeStyle = "rgba(0,50,0,0.1)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  drawPetals(flower) {
    const petals = flower.petals;
    const segments = flower.segments;
    if (petals.length === 0) return;

    for (const petal of petals) {
        const anchorPos = segments[petal.anchorIndex].pos;
        
        // A. GEOMETRY GENERATION
        const shape = generatePetalBezier(petal, anchorPos);

        // B. PARAMETRIC VARIATION
        const hueBase = 340; 
        const hueVar = (petal.anchorIndex * 137.5) % 20; 
        const sat = 70 + petal.openness * 10;
        const lit = 50 + (petal.angleOffset % 1) * 10;
        
        const colorMain = `hsl(${hueBase + hueVar}, ${sat}%, ${lit}%)`;
        const colorTip = `hsl(${hueBase + hueVar + 10}, ${sat}%, ${lit + 10}%)`;

        // C. RENDERING
        const grad = this.ctx.createLinearGradient(anchorPos.x, anchorPos.y, petal.tipPos.x, petal.tipPos.y);
        grad.addColorStop(0, colorMain);
        grad.addColorStop(1, colorTip);
        
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.moveTo(anchorPos.x, anchorPos.y);
        
        // Left curve
        this.ctx.quadraticCurveTo(shape.cpLeft.x, shape.cpLeft.y, petal.tipPos.x, petal.tipPos.y);
        // Right curve
        this.ctx.quadraticCurveTo(shape.cpRight.x, shape.cpRight.y, anchorPos.x, anchorPos.y);
        
        this.ctx.fill();
        
        // Tension Ridge
        this.ctx.strokeStyle = "rgba(0,0,0,0.1)";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(anchorPos.x, anchorPos.y);
        this.ctx.lineTo(petal.tipPos.x, petal.tipPos.y);
        this.ctx.stroke();
    }
  }

  drawDebugStats(flower) {
    if (!flower) return;
    this.ctx.fillStyle = "#888";
    this.ctx.font = "12px monospace";
    this.ctx.fillText(`Segments: ${flower.segments.length}`, 10, 20);
    this.ctx.fillText(`Petals: ${flower.petals.length}`, 10, 35);
    this.ctx.fillText(
      `Bloom: ${(flower.bloomFactor * 100).toFixed(0)}%`,
      10,
      50,
    );
  }
}

// --- PURE HELPER FUNCTIONS ---

function computeLoadMap(segments) {
    const loadMap = new Map();
    let accumulatedLoad = 0;
    for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        accumulatedLoad += seg.mass;
        loadMap.set(i, accumulatedLoad);
    }
    return loadMap;
}

function sampleThickness(load, age) {
    const maturityFactor = Math.min(age * 0.5, 5.0) + 2.0;
    return maturityFactor * Math.sqrt(load) * 1.5;
}

function computeStemGeometry(segments, loadMap, structuralAge) {
    const leftPoints = [];
    const rightPoints = [];

    for (let i = 0; i < segments.length; i++) {
        const p = segments[i].pos;
        
        let tangent = new Vector2(0, -1);
        if (i === 0) {
            tangent = segments[i+1].pos.clone().sub(p);
        } else if (i === segments.length - 1) {
            tangent = p.clone().sub(segments[i-1].pos);
        } else {
            const v1 = p.clone().sub(segments[i-1].pos);
            const v2 = segments[i+1].pos.clone().sub(p);
            tangent = v1.add(v2);
        }
        tangent.normalize();
        
        const normal = new Vector2(-tangent.y, tangent.x);
        
        const load = loadMap.get(i) || 0.1;
        const radius = sampleThickness(load, structuralAge);
        
        leftPoints.push(p.clone().add(normal.clone().mult(radius)));
        rightPoints.push(p.clone().sub(normal.clone().mult(radius)));
    }
    
    return { leftPoints, rightPoints };
}

function generatePetalBezier(petal, anchorPos) {
    const axis = petal.tipPos.clone().sub(anchorPos);
    const len = axis.mag();
    const axisNorm = axis.clone().normalize();
    const perp = new Vector2(-axisNorm.y, axisNorm.x);

    const width = len * 0.4 * (0.5 + petal.openness * 0.5);

    const midPoint = anchorPos.clone().add(axis.clone().mult(0.4));
    const cpLeft = midPoint.clone().add(perp.clone().mult(width));
    const cpRight = midPoint.clone().sub(perp.clone().mult(width));

    return { cpLeft, cpRight };
}

function drawSpline(ctx, points) {
    if (points.length < 2) return;
    
    ctx.lineTo(points[0].x, points[0].y);
    
    const tension = 0.25;
    
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
}

// Expose to global scope
window.FlowerRenderer = FlowerRenderer;