import * as THREE from 'three';

/**
 * BlochSphere3D - Interactive 3D visualization of a single qubit state
 * Renders in AR/VR space with proper scaling and visual effects
 */
export class BlochSphere3D {
    constructor(scale = 0.3) {
        this.scale = scale;
        this.group = new THREE.Group();
        this.stateVector = null;
        this.trailPoints = [];
        this.maxTrailLength = 30;
        
        this.createSphere();
        this.createAxes();
        this.createStateVector();
        this.createLabels();
        this.createTrail();
    }

    /**
     * Create the transparent sphere shell with grid lines
     */
    createSphere() {
        // Main sphere (wireframe + semi-transparent)
        const geometry = new THREE.SphereGeometry(this.scale, 32, 32);
        
        // Wireframe sphere
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a90e2,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
        this.group.add(wireframe);

        // Glass-like sphere shell
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.08,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });
        const glassSphere = new THREE.Mesh(geometry, glassMaterial);
        this.group.add(glassSphere);

        // Equator circle (bright)
        const equatorGeometry = new THREE.TorusGeometry(this.scale, 0.002, 16, 100);
        const equatorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6
        });
        const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
        equator.rotation.x = Math.PI / 2;
        this.group.add(equator);

        // Meridian circles
        for (let i = 0; i < 4; i++) {
            const meridianGeometry = new THREE.TorusGeometry(this.scale, 0.001, 16, 100);
            const meridianMaterial = new THREE.MeshBasicMaterial({
                color: 0x4a90e2,
                transparent: true,
                opacity: 0.3
            });
            const meridian = new THREE.Mesh(meridianGeometry, meridianMaterial);
            meridian.rotation.y = (i * Math.PI) / 4;
            this.group.add(meridian);
        }
    }

    /**
     * Create X, Y, Z coordinate axes
     */
    createAxes() {
        const axisLength = this.scale * 1.3;
        const arrowLength = this.scale * 0.1;

        // Z axis (vertical - blue) |0⟩ at top, |1⟩ at bottom
        this.createAxis([0, axisLength, 0], 0x3b82f6, 'Z');
        
        // X axis (red)
        this.createAxis([axisLength, 0, 0], 0xef4444, 'X');
        
        // Y axis (orange/yellow)
        this.createAxis([0, 0, axisLength], 0xf59e0b, 'Y');
    }

    /**
     * Helper to create a single axis with arrow
     */
    createAxis(endPos, color, label) {
        const axisLength = this.scale * 1.3;
        
        // Line
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(...endPos)
        ]);
        const material = new THREE.LineBasicMaterial({ 
            color,
            transparent: true,
            opacity: 0.7,
            linewidth: 2
        });
        const line = new THREE.Line(geometry, material);
        this.group.add(line);

        // Arrow head
        const arrowGeometry = new THREE.ConeGeometry(0.015, 0.04, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.set(...endPos);
        
        // Orient arrow to point along axis
        if (label === 'Z') {
            arrow.rotation.x = endPos[1] > 0 ? 0 : Math.PI;
        } else if (label === 'X') {
            arrow.rotation.z = endPos[0] > 0 ? -Math.PI / 2 : Math.PI / 2;
        } else if (label === 'Y') {
            arrow.rotation.x = endPos[2] > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
        
        this.group.add(arrow);

        // Store axis info for labels (created separately)
        if (!this.axisLabels) this.axisLabels = [];
        this.axisLabels.push({ position: endPos, color, label });
    }

    /**
     * Create text sprites for axis labels
     */
    createLabels() {
        const createTextSprite = (text, color) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 64;
            
            context.font = 'Bold 48px Arial';
            context.fillStyle = color;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(0.05, 0.05, 1);
            
            return sprite;
        };

        // Z labels
        const zUpLabel = createTextSprite('|0⟩', '#3b82f6');
        zUpLabel.position.set(0, this.scale * 1.45, 0);
        this.group.add(zUpLabel);

        const zDownLabel = createTextSprite('|1⟩', '#3b82f6');
        zDownLabel.position.set(0, -this.scale * 1.45, 0);
        this.group.add(zDownLabel);

        // X, Y labels
        const xLabel = createTextSprite('X', '#ef4444');
        xLabel.position.set(this.scale * 1.45, 0, 0);
        this.group.add(xLabel);

        const yLabel = createTextSprite('Y', '#f59e0b');
        yLabel.position.set(0, 0, this.scale * 1.45);
        this.group.add(yLabel);
    }

    /**
     * Create the quantum state vector (the moving purple dot)
     */
    createStateVector() {
        // Glowing sphere for the state
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xa78bfa,
        });
        this.stateVector = new THREE.Mesh(geometry, material);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.03, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xa78bfa,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.stateVector.add(glow);
        
        this.group.add(this.stateVector);

        // Line from center to state vector
        this.stateLineGeometry = new THREE.BufferGeometry();
        this.stateLineGeometry.setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, this.scale, 0) // Initial position at |0⟩
        ]);
        const lineMaterial = new THREE.LineDashedMaterial({
            color: 0xa78bfa,
            linewidth: 1,
            dashSize: 0.01,
            gapSize: 0.01,
            transparent: true,
            opacity: 0.6
        });
        this.stateLine = new THREE.Line(this.stateLineGeometry, lineMaterial);
        this.stateLine.computeLineDistances();
        this.group.add(this.stateLine);
    }

    /**
     * Create state vector trail (shows evolution history)
     */
    createTrail() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: 0xa78bfa,
            transparent: true,
            opacity: 0.4,
            linewidth: 1
        });
        this.trail = new THREE.Line(geometry, material);
        this.group.add(this.trail);
    }

    /**
     * Update the Bloch sphere to show new quantum state
     * @param {Object} blochCoords - {x, y, z} coordinates from quantum simulator
     */
    updateState(blochCoords) {
        const { x, y, z } = blochCoords;
        
        // Convert Bloch coordinates to 3D position
        // Note: We map quantum Z (|0⟩/|1⟩) to Three.js Y (up/down)
        const position = new THREE.Vector3(
            x * this.scale,
            z * this.scale,  // Z quantum -> Y visual (up is |0⟩)
            y * this.scale   // Y quantum -> Z visual
        );

        // Update state vector position
        this.stateVector.position.copy(position);

        // Update line from center to state
        this.stateLineGeometry.setFromPoints([
            new THREE.Vector3(0, 0, 0),
            position
        ]);
        this.stateLine.computeLineDistances();

        // Update trail
        this.trailPoints.push(position.clone());
        if (this.trailPoints.length > this.maxTrailLength) {
            this.trailPoints.shift();
        }
        this.trail.geometry.setFromPoints(this.trailPoints);

        // Visual feedback: glow intensity based on superposition
        const superposition = Math.sqrt(1 - z * z); // How much we're in superposition
        this.stateVector.children[0].material.opacity = 0.2 + superposition * 0.5;
    }

    /**
     * Clear the state trail
     */
    clearTrail() {
        this.trailPoints = [];
        this.trail.geometry.setFromPoints([]);
    }

    /**
     * Animate the sphere (gentle rotation, pulsing effects)
     */
    animate(deltaTime) {
        // Gentle rotation of the entire sphere
        this.group.rotation.y += deltaTime * 0.1;

        // Pulse the state vector glow
        const pulseSpeed = 2.0;
        const pulse = Math.sin(Date.now() * 0.001 * pulseSpeed) * 0.5 + 0.5;
        if (this.stateVector.children[0]) {
            this.stateVector.children[0].scale.setScalar(0.8 + pulse * 0.4);
        }
    }

    /**
     * Get the Three.js group containing all sphere components
     */
    getObject3D() {
        return this.group;
    }

    /**
     * Set the position of the entire Bloch sphere in world space
     */
    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    /**
     * Scale the entire sphere uniformly
     */
    setScale(scale) {
        this.group.scale.setScalar(scale);
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.group.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}
