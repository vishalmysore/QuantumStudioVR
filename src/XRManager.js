import * as THREE from 'three';

/**
 * XRManager - Handles WebXR session management for AR experiences
 * Supports hit-testing, object placement, and hand/controller tracking
 */
export class XRManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        this.session = null;
        this.referenceSpace = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        
        this.reticle = null;
        this.placedObjects = [];
        this.onPlaceCallback = null;
        
        this.isSupported = false;
        this.isSessionActive = false;
        
        this.checkARSupport();
        this.createReticle();
    }

    /**
     * Check if WebXR AR is supported on this device
     */
    async checkARSupport() {
        if ('xr' in navigator) {
            try {
                this.isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                console.log('WebXR AR support:', this.isSupported);
            } catch (error) {
                console.error('Error checking AR support:', error);
                this.isSupported = false;
            }
        } else {
            console.warn('WebXR not available');
            this.isSupported = false;
        }
    }

    /**
     * Create the reticle (placement indicator)
     */
    createReticle() {
        const geometry = new THREE.RingGeometry(0.1, 0.12, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        this.reticle = new THREE.Mesh(geometry, material);
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);

        // Add inner dot
        const dotGeometry = new THREE.CircleGeometry(0.02, 16);
        const dotMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.9
        });
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.rotation.x = -Math.PI / 2;
        this.reticle.add(dot);

        // Pulsing animation
        this.reticle.userData.pulsePhase = 0;
    }

    /**
     * Start an immersive AR session
     */
    async startARSession() {
        if (!this.isSupported) {
            throw new Error('WebXR AR is not supported on this device');
        }

        try {
            const sessionInit = {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay', 'local-floor'],
                domOverlay: { root: document.body }
            };

            this.session = await navigator.xr.requestSession('immersive-ar', sessionInit);
            
            // Configure renderer for XR
            await this.renderer.xr.setSession(this.session);
            
            // Set up reference space
            this.referenceSpace = await this.session.requestReferenceSpace('local-floor');
            
            // Set up hit testing
            this.requestHitTestSource();
            
            // Session event handlers
            this.session.addEventListener('end', () => {
                this.onSessionEnd();
            });

            // Enable XR on renderer
            this.renderer.xr.enabled = true;
            this.isSessionActive = true;

            console.log('AR session started successfully');
            return true;
        } catch (error) {
            console.error('Failed to start AR session:', error);
            throw error;
        }
    }

    /**
     * Request a hit test source for placing objects
     */
    async requestHitTestSource() {
        if (!this.session || this.hitTestSourceRequested) return;

        this.hitTestSourceRequested = true;
        
        if (this.session.requestHitTestSource) {
            try {
                const viewerSpace = await this.session.requestReferenceSpace('viewer');
                this.hitTestSource = await this.session.requestHitTestSource({ space: viewerSpace });
                console.log('Hit test source acquired');
            } catch (error) {
                console.error('Error requesting hit test source:', error);
            }
        }
    }

    /**
     * End the AR session
     */
    async endARSession() {
        if (this.session) {
            await this.session.end();
        }
    }

    /**
     * Called when AR session ends
     */
    onSessionEnd() {
        this.session = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.reticle.visible = false;
        this.isSessionActive = false;
        this.renderer.xr.enabled = false;
        
        console.log('AR session ended');
    }

    /**
     * Update hit test and reticle position (call every frame)
     */
    updateHitTest(frame) {
        if (!frame || !this.hitTestSource || !this.referenceSpace) {
            return null;
        }

        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        
        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(this.referenceSpace);
            
            if (pose) {
                this.reticle.visible = true;
                this.reticle.matrix.fromArray(pose.transform.matrix);
                
                // Animate reticle pulse
                this.reticle.userData.pulsePhase += 0.05;
                const scale = 1 + Math.sin(this.reticle.userData.pulsePhase) * 0.1;
                this.reticle.scale.set(scale, scale, scale);
                
                return pose;
            }
        }
        
        this.reticle.visible = false;
        return null;
    }

    /**
     * Get the current reticle position (for placing objects)
     */
    getReticlePosition() {
        if (!this.reticle.visible) return null;
        
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(this.reticle.matrix);
        return position;
    }

    /**
     * Place an object at the current reticle position
     */
    placeObject(object) {
        const position = this.getReticlePosition();
        if (!position) return false;

        object.position.copy(position);
        this.scene.add(object);
        this.placedObjects.push(object);
        
        if (this.onPlaceCallback) {
            this.onPlaceCallback(object, position);
        }
        
        return true;
    }

    /**
     * Remove all placed objects
     */
    clearPlacedObjects() {
        this.placedObjects.forEach(obj => {
            this.scene.remove(obj);
        });
        this.placedObjects = [];
    }

    /**
     * Set callback for when object is placed
     */
    onPlace(callback) {
        this.onPlaceCallback = callback;
    }

    /**
     * Check if we're currently in an AR session
     */
    isInARSession() {
        return this.isSessionActive;
    }

    /**
     * Get XR controller (for button input)
     */
    getController(index = 0) {
        return this.renderer.xr.getController(index);
    }

    /**
     * Set up controller event listeners
     */
    setupControllerListeners(onSelect) {
        const controller = this.getController(0);
        
        controller.addEventListener('select', () => {
            if (onSelect) onSelect();
        });
        
        this.scene.add(controller);
        return controller;
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.session) {
            this.endARSession();
        }
        
        if (this.reticle) {
            this.scene.remove(this.reticle);
            this.reticle.geometry.dispose();
            this.reticle.material.dispose();
        }
    }
}

/**
 * Helper function to check WebXR support with detailed info
 */
export async function getXRCapabilities() {
    if (!('xr' in navigator)) {
        return {
            supported: false,
            reason: 'WebXR not available in this browser'
        };
    }

    try {
        const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
        const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        
        return {
            supported: arSupported || vrSupported,
            ar: arSupported,
            vr: vrSupported,
            reason: null
        };
    } catch (error) {
        return {
            supported: false,
            reason: error.message
        };
    }
}
