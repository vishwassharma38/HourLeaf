// flower_system.js
// Phase 4.5: Systemic Maturity & Force Feedback
// - Unified 'structuralAge' drives all relaxation and growth
// - Petals exert true physical torque/force on the stem
// - Biological coherence: The whole plant ages together

class Petal {
    constructor(anchorIndex, angleOffset, targetLength, spawnTime) {
        // Structural Identity
        this.anchorIndex = anchorIndex; 
        this.angleOffset = angleOffset; 
        
        // Biological State (Unified Time)
        this.spawnTime = spawnTime; // When in 'structuralAge' this was born
        
        this.targetLength = targetLength;
        this.currentLength = 0.1; 
        this.openness = 0.0;
        
        // Physical State
        this.tipPos = new Vector2(0, 0); 
        this.tipVel = new Vector2(0, 0);
        this.mass = 0.3; // Increased mass to ensure visible feedback
        
        this.stiffness = 50.0; 
    }
}

class StemSegment {
    constructor(pos, parentIndex, targetRestLength, targetFlexibility, mass, spawnTime) {
        this.pos = pos.clone();
        this.vel = new Vector2(0, 0);
        
        this.parentIndex = parentIndex;
        this.mass = mass;
        
        // Biological State (Unified Time)
        this.spawnTime = spawnTime; // Reference to flower.structuralAge at birth

        // Growth & Physics Properties
        this.targetRestLength = targetRestLength;
        this.currentRestLength = 1.0; 
        
        this.targetFlexibility = targetFlexibility;
        this.currentFlexibility = 0.0; 
    }
}

class Flower {
    constructor(rootX, rootY) {
        // Configuration
        this.baseStiffness = 60.0;
        this.growthRate = 1.0;
        this.bloomFactor = 0.0; 
        
        // --- UNIFIED SYSTEMIC AGE ---
        // This single scalar drives all maturation, relaxation, and growth.
        // It replaces ad-hoc timers in sub-objects.
        this.structuralAge = 0.0; 
        
        // State
        this.segments = [];
        this.petals = [];
        
        // Root Setup
        const rootPos = new Vector2(rootX, rootY);
        // Root is born at age 0
        const root = new StemSegment(rootPos, -1, 0, 0, 1000, 0.0);
        root.currentRestLength = 0;
        this.segments.push(root);
        
        this.nextSpawnAge = 0; // Spawning is now age-driven, not raw time-driven
    }

    update(dt, env) {
        // Advance the biological clock
        this.structuralAge += dt * this.growthRate;

        // 1. Systemic Maturation (Growth & Relaxation)
        this.processMaturation(dt);

        // 2. Physical Simulation (Forces & Integration)
        this.processPhysics(dt, env);
    }

    processMaturation(dt) {
        const maxSegments = 12;
        const spawnInterval = 1.2; // Structural age units

        // A. Spawn New Segments (Age-Driven)
        if (this.structuralAge > this.nextSpawnAge && this.segments.length < maxSegments) {
            this.spawnSegment();
            this.nextSpawnAge = this.structuralAge + spawnInterval;
        }

        // B. Maturation of Segments (Unified Relaxation)
        for (let i = 1; i < this.segments.length; i++) {
            const seg = this.segments[i];
            
            // Calculate relative age (how long this specific segment has existed)
            const segmentAge = this.structuralAge - seg.spawnTime;
            
            // Growth: Asymptotic approach based on segmentAge
            // It takes ~3 age units to reach 95% length
            const growthProgress = 1.0 - Math.exp(-segmentAge * 1.5);
            
            seg.currentRestLength = seg.targetRestLength * growthProgress;

            // Relaxation: Young = Rigid, Old = Flexible
            // Flexibility increases linearly with age until it hits target
            const maturationTime = 5.0; // Age units to full flexibility
            const maturity = Math.min(segmentAge / maturationTime, 1.0);
            seg.currentFlexibility = seg.targetFlexibility * maturity;
        }

        // C. Petal Spawning & Bloom Driver
        // Bloom is triggered by structural age + segment count
        if (this.segments.length > 5 && this.structuralAge > 8.0) {
            // Auto-bloom based on age if not externally controlled
            // (In a real game, this might be clamped, but here we let age drive it)
            if (this.bloomFactor < 1.0) {
                this.bloomFactor += dt * 0.1; 
            }
        }
        
        if (this.bloomFactor > 0.05 && this.petals.length === 0) {
            this.spawnPetals();
        }

        // D. Maturation of Petals
        for (const petal of this.petals) {
            const petalAge = this.structuralAge - petal.spawnTime;

            // Length Growth
            const lengthProgress = 1.0 - Math.exp(-petalAge * 2.0);
            petal.currentLength = petal.targetLength * lengthProgress;

            // Openness: Driven by bloomFactor (external/hormonal) but lagged by physics
            // We approach the global bloomFactor
            const bloomRate = 0.5;
            petal.openness += (this.bloomFactor - petal.openness) * dt * bloomRate;

            // Stiffness Relaxation: Buds are hard, Flowers are soft
            // Mapping: 0% open -> 100% stiff, 100% open -> 10% stiff
            const targetStiffness = 50.0 * (1.0 - (petal.openness * 0.9));
            petal.stiffness += (targetStiffness - petal.stiffness) * dt;
        }
    }

    spawnSegment() {
        const parentIndex = this.segments.length - 1;
        const parent = this.segments[parentIndex];
        const generation = this.segments.length;
        
        // Biological Targets
        const mass = Math.max(0.1, 1.0 - (generation * 0.08));
        const targetFlexibility = Math.min(1.0, 0.1 + (generation * 0.15));
        const targetLength = 35; 

        const spawnPos = parent.pos.clone();

        const newSegment = new StemSegment(
            spawnPos,
            parentIndex,
            targetLength,
            targetFlexibility,
            mass,
            this.structuralAge // Pass current system time
        );

        this.segments.push(newSegment);
    }

    spawnPetals() {
        const topIndex = this.segments.length - 1;
        const count = 6;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const len = 40 + Math.random() * 10; 
            
            const petal = new Petal(topIndex, angle, len, this.structuralAge);
            
            // Initialize tip at anchor (bud)
            petal.tipPos = this.segments[topIndex].pos.clone();
            
            this.petals.push(petal);
        }
    }

    processPhysics(dt, env) {
        const { gravity, wind, time } = env;

        // --- 1. STEM PHYSICS ---
        for (let i = 1; i < this.segments.length; i++) {
            const seg = this.segments[i];
            const force = new Vector2(0, 0);

            // Gravity
            force.add(gravity.clone().mult(seg.mass));
            
            // Wind Field Sampling
            // Phase 5: Spatiotemporal sampling per segment
            const windForce = wind.getForce(seg.pos, time);
            
            // Apply wind force (Mass interaction is implicit F=ma, but heavier segments resist more naturally)
            // We apply the force directly. 
            force.add(windForce);

            // Structural Constraint (Spring to Parent)
            const parent = this.segments[seg.parentIndex];
            const vectorToParent = parent.pos.clone().sub(seg.pos);
            const dist = vectorToParent.mag();
            
            if (dist > 0) {
                const stretch = dist - seg.currentRestLength;
                const k = this.baseStiffness * 3; 
                force.add(vectorToParent.normalize().mult(k * stretch));
            }

            // Bending (Angular)
            let targetDir;
            if (seg.parentIndex === 0) {
                targetDir = new Vector2(0, -1);
            } else {
                const grandParent = this.segments[parent.parentIndex];
                targetDir = parent.pos.clone().sub(grandParent.pos).normalize();
            }

            const idealPos = parent.pos.clone().add(targetDir.mult(seg.currentRestLength));
            const stiffness = this.baseStiffness * (1.0 - seg.currentFlexibility);
            force.add(idealPos.sub(seg.pos).mult(stiffness));

            // Integration
            const acc = force.mult(1 / seg.mass);
            seg.vel.add(acc.mult(dt));
            seg.vel.mult(0.92); 
            seg.pos.add(seg.vel.clone().mult(dt));
        }

        // --- 2. PETAL PHYSICS & FEEDBACK ---
        for (const petal of this.petals) {
            const anchor = this.segments[petal.anchorIndex];
            const force = new Vector2(0, 0);

            // A. Petal Forces
            force.add(gravity.clone().mult(petal.mass));

            // Phase 5: Petal Wind Interaction
            // Petals sample the same field but experience more force due to surface area
            const rawWind = wind.getForce(petal.tipPos, time);
            const petalWind = rawWind.mult(2.5); // Surface area proxy multiplier
            force.add(petalWind);

            // B. Constraint: Attachment
            const vectorToAnchor = anchor.pos.clone().sub(petal.tipPos);
            const dist = vectorToAnchor.mag();
            
            // Stiff length constraint
            if (dist > 0) {
                const stretch = dist - petal.currentLength;
                const tension = vectorToAnchor.normalize().mult(200 * stretch);
                force.add(tension);
                
                // --- CRITICAL: FORCE FEEDBACK ---
                // Newton's 3rd Law: The force pulling the petal to the stem 
                // generates an equal and opposite force pulling the stem to the petal.
                // This transfers weight, wind, and inertia to the stem.
                anchor.vel.sub(tension.clone().mult(dt / anchor.mass));
            }

            // C. Constraint: Angular (Posture)
            // Determine target tip position based on openness
            let stemDir = new Vector2(0, -1);
            if (petal.anchorIndex > 0) {
                const prev = this.segments[petal.anchorIndex - 1];
                stemDir = anchor.pos.clone().sub(prev.pos).normalize();
            }

            const spreadDir = new Vector2(Math.cos(petal.angleOffset), Math.sin(petal.angleOffset));
            // When open, we bias heavily towards the spread direction
            // When closed, we align with stem
            const targetDir = stemDir.clone().mult(1 - petal.openness).add(spreadDir.mult(petal.openness)).normalize();
            const targetTipPos = anchor.pos.clone().add(targetDir.mult(petal.currentLength));
            
            // Angular Spring Force
            const angularForce = targetTipPos.sub(petal.tipPos).mult(petal.stiffness);
            force.add(angularForce);
            
            // --- CRITICAL: TORQUE FEEDBACK ---
            // The effort to hold the petal at an angle creates torque on the stem.
            // Simplified: The spring force acting on the petal has a reaction on the stem.
            // This pushes the stem AWAY from the petal's target direction.
            anchor.vel.sub(angularForce.clone().mult(dt * 0.5 / anchor.mass));


            // Integration
            const acc = force.mult(1 / petal.mass);
            petal.tipVel.add(acc.mult(dt));
            petal.tipVel.mult(0.90); 
                        petal.tipPos.add(petal.tipVel.clone().mult(dt));
                    }
                }
            }
            
            // Expose to global scope
            window.Flower = Flower;
            