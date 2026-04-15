import * as THREE from 'three';
import { BlochSphere3D } from './BlochSphere3D.js';
import { QuantumSimulator } from './QuantumSimulator.js';
import { XRManager, getXRCapabilities } from './XRManager.js';

/**
 * Quantum VR - Main Application
 * WebXR AR quantum visualization experience
 */
class QuantumVRApp {
    constructor() {
        this.container = document.getElementById('app');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrManager = null;
        
        this.blochSphere = null;
        this.quantumSimulator = null;
        
        this.clock = new THREE.Clock();
        this.isARActive = false;
        
        this.init();
    }

    async init() {
        // Set up Three.js scene immediately
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        
        // Initialize quantum system
        this.quantumSimulator = new QuantumSimulator();
        this.blochSphere = new BlochSphere3D(0.3);
        
        // Set up XR manager
        this.xrManager = new XRManager(this.renderer, this.scene, this.camera);
        
        // Set up UI controls
        this.setupUI();
        
        // Set up XR controller
        this.controller = this.xrManager.setupControllerListeners(() => {
            this.onARSelect();
        });
        
        // Start animation loop
        this.renderer.setAnimationLoop((timestamp, frame) => {
            this.animate(timestamp, frame);
        });
        
        // Resize handler
        window.addEventListener('resize', () => this.onResize());
        
        console.log('Quantum VR initialized');

        // Check XR capabilities asynchronously with a timeout
        try {
            const timeoutPromise = new Promise(resolve => 
                setTimeout(() => resolve({ supported: false, reason: 'Timeout checking WebXR' }), 2000)
            );
            const capabilities = await Promise.race([getXRCapabilities(), timeoutPromise]);
            this.updateXRStatus(capabilities);
        } catch (error) {
            this.updateXRStatus({ supported: false, reason: error.message || 'Error checking WebXR' });
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.01,
            100
        );
        this.camera.position.set(0, 1.6, 0); // Eye level
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = false; // Will be enabled when AR starts
        this.container.appendChild(this.renderer.domElement);
    }

    setupLights() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light for shadows and depth
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 2, 1);
        this.scene.add(directionalLight);
        
        // Extra light from below for nice rim lighting
        const rimLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
        rimLight.position.set(0, -1, 0);
        this.scene.add(rimLight);
    }

    setupUI() {
        // AR Button
        const arButton = document.getElementById('ar-button');
        arButton.addEventListener('click', () => this.toggleAR());
        
        // Quantum gate buttons
        const gates = ['H', 'X', 'Y', 'Z', 'S', 'T'];
        gates.forEach(gate => {
            const btn = document.getElementById(`gate-${gate.toLowerCase()}`);
            if (btn) {
                btn.addEventListener('click', () => this.applyGate(gate));
            }
        });
        
        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
        
        // Measure button
        const measureBtn = document.getElementById('measure-btn');
        if (measureBtn) {
            measureBtn.addEventListener('click', () => this.measure());
        }
        
        // Rotation gates (with angle input)
        ['rx', 'ry', 'rz'].forEach(gate => {
            const btn = document.getElementById(`gate-${gate}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    const angle = parseFloat(document.getElementById('rotation-angle')?.value || 0);
                    this.applyGate(gate.toUpperCase(), angle * Math.PI / 180);
                });
            }
        });
        
        // Place sphere button (alternative to controller select)
        const placeBtn = document.getElementById('place-btn');
        if (placeBtn) {
            placeBtn.addEventListener('click', () => this.onARSelect());
        }
    }

    async toggleAR() {
        const arButton = document.getElementById('ar-button');
        const controls = document.getElementById('controls');
        
        if (!this.isARActive) {
            try {
                arButton.textContent = 'Starting AR...';
                arButton.disabled = true;
                
                await this.xrManager.startARSession();
                
                this.isARActive = true;
                arButton.textContent = 'Exit AR';
                arButton.disabled = false;
                controls.style.display = 'block';

                // Show placement instructions
                this.showMessage('Point at a surface and tap to place the Bloch sphere');
            } catch (error) {
                console.error('Failed to start AR:', error);
                alert('Could not start AR session. Make sure you are on a compatible device and have granted camera permissions.');
                arButton.textContent = 'Enter AR';
                arButton.disabled = false;
            }
        } else {
            await this.xrManager.endARSession();
            this.isARActive = false;
            arButton.textContent = 'Enter AR';
            controls.style.display = 'none';
        }
    }

    onARSelect() {
        if (!this.isARActive) return;
        
        const position = this.xrManager.getReticlePosition();
        if (!position) {
            this.showMessage('No surface detected. Point at a flat surface.');
            return;
        }
        
        // If sphere not in scene yet, add it
        if (!this.blochSphere.getObject3D().parent) {
            this.scene.add(this.blochSphere.getObject3D());
            this.blochSphere.setPosition(position.x, position.y, position.z);
            this.showMessage('Bloch sphere placed! Use controls to apply quantum gates.');
            
            // Initialize display
            this.updateQuantumState();
        } else {
            // Move existing sphere
            this.blochSphere.setPosition(position.x, position.y, position.z);
            this.showMessage('Sphere moved to new position');
        }
    }

    applyGate(gateName, angle = null) {
        if (!this.blochSphere.getObject3D().parent) {
            this.showMessage('Please place the Bloch sphere first!');
            return;
        }
        
        this.quantumSimulator.applyGate(gateName, angle);
        this.updateQuantumState();
        
        const angleText = angle !== null ? ` (${(angle * 180 / Math.PI).toFixed(1)}°)` : '';
        this.showMessage(`Applied ${gateName} gate${angleText}`);
    }

    reset() {
        this.quantumSimulator.reset();
        this.blochSphere.clearTrail();
        this.updateQuantumState();
        this.showMessage('Reset to |0⟩ state');
    }

    measure() {
        if (!this.blochSphere.getObject3D().parent) {
            this.showMessage('Please place the Bloch sphere first!');
            return;
        }
        
        const result = this.quantumSimulator.measure();
        this.updateQuantumState();
        this.showMessage(`Measured: |${result}⟩`, true);
        
        // Visual feedback: flash effect
        this.blochSphere.clearTrail();
    }

    updateQuantumState() {
        // Update Bloch sphere visualization
        const coords = this.quantumSimulator.getBlochCoordinates();
        this.blochSphere.updateState(coords);
        
        // Update probability display
        const probs = this.quantumSimulator.getProbabilities();
        this.updateProbabilityDisplay(probs);
        
        // Update state vector text
        const stateText = this.quantumSimulator.toString();
        this.updateStateDisplay(stateText);
    }

    updateProbabilityDisplay(probs) {
        const prob0Elem = document.getElementById('prob-0');
        const prob1Elem = document.getElementById('prob-1');
        
        if (prob0Elem) {
            prob0Elem.textContent = (probs.prob0 * 100).toFixed(1);
            prob0Elem.style.width = (probs.prob0 * 100) + '%';
        }
        if (prob1Elem) {
            prob1Elem.textContent = (probs.prob1 * 100).toFixed(1);
            prob1Elem.style.width = (probs.prob1 * 100) + '%';
        }
    }

    updateStateDisplay(stateText) {
        const stateElem = document.getElementById('state-vector');
        if (stateElem) {
            stateElem.textContent = stateText;
        }
    }

    showMessage(text, important = false) {
        const messageElem = document.getElementById('message');
        if (messageElem) {
            messageElem.textContent = text;
            messageElem.style.display = 'block';
            messageElem.style.backgroundColor = important ? 'rgba(168, 85, 247, 0.9)' : 'rgba(0, 0, 0, 0.7)';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                messageElem.style.display = 'none';
            }, 3000);
        }
    }

    updateXRStatus(capabilities) {
        const statusElem = document.getElementById('xr-status');
        const arButton = document.getElementById('ar-button');
        
        if (!capabilities.supported) {
            if (statusElem) {
                statusElem.textContent = '⚠️ WebXR not supported on this device';
                statusElem.className = 'error';
            }
            if (arButton) {
                arButton.disabled = true;
                arButton.textContent = 'AR Not Supported';
            }
        } else {
            if (statusElem) {
                const modes = [];
                if (capabilities.ar) modes.push('AR');
                if (capabilities.vr) modes.push('VR');
                statusElem.textContent = `✓ ${modes.join(' & ')} Ready`;
                statusElem.className = 'success';
            }
        }
    }

    animate(timestamp, frame) {
        const deltaTime = this.clock.getDelta();
        
        // Update XR hit test
        if (this.isARActive && frame) {
            this.xrManager.updateHitTest(frame);
        }
        
        // Animate Bloch sphere
        if (this.blochSphere) {
            this.blochSphere.animate(deltaTime);
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new QuantumVRApp();
    });
} else {
    new QuantumVRApp();
}
