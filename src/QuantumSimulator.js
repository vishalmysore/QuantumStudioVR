/**
 * Quantum Simulator for WebXR
 * Simulates single-qubit quantum states and calculates Bloch sphere coordinates
 */

class Complex {
    constructor(real, imag = 0) {
        this.re = real;
        this.im = imag;
    }

    add(other) {
        return new Complex(this.re + other.re, this.im + other.im);
    }

    subtract(other) {
        return new Complex(this.re - other.re, this.im - other.im);
    }

    multiply(other) {
        if (typeof other === 'number') {
            return new Complex(this.re * other, this.im * other);
        }
        return new Complex(
            this.re * other.re - this.im * other.im,
            this.re * other.im + this.im * other.re
        );
    }

    conjugate() {
        return new Complex(this.re, -this.im);
    }

    magnitude() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    magnitudeSquared() {
        return this.re * this.re + this.im * this.im;
    }

    normalize() {
        const mag = this.magnitude();
        return mag > 0 ? new Complex(this.re / mag, this.im / mag) : this;
    }
}

export class QuantumState {
    constructor(alpha = new Complex(1, 0), beta = new Complex(0, 0)) {
        this.alpha = alpha; // Amplitude of |0⟩
        this.beta = beta;   // Amplitude of |1⟩
        this.normalize();
    }

    normalize() {
        const norm = Math.sqrt(this.alpha.magnitudeSquared() + this.beta.magnitudeSquared());
        if (norm > 0) {
            this.alpha = new Complex(this.alpha.re / norm, this.alpha.im / norm);
            this.beta = new Complex(this.beta.re / norm, this.beta.im / norm);
        }
    }

    /**
     * Convert quantum state to Bloch sphere coordinates (x, y, z)
     * x = 2 * Re(α* β)
     * y = 2 * Im(α* β)
     * z = |α|² - |β|²
     */
    toBlochCoordinates() {
        const alphaConj = this.alpha.conjugate();
        const product = alphaConj.multiply(this.beta);
        
        const x = 2 * product.re;
        const y = 2 * product.im;
        const z = this.alpha.magnitudeSquared() - this.beta.magnitudeSquared();

        return { x, y, z };
    }

    /**
     * Get the probability of measuring |0⟩
     */
    prob0() {
        return this.alpha.magnitudeSquared();
    }

    /**
     * Get the probability of measuring |1⟩
     */
    prob1() {
        return this.beta.magnitudeSquared();
    }

    /**
     * Clone the quantum state
     */
    clone() {
        return new QuantumState(
            new Complex(this.alpha.re, this.alpha.im),
            new Complex(this.beta.re, this.beta.im)
        );
    }
}

/**
 * Quantum gate operations
 */
export class QuantumGates {
    /**
     * Hadamard gate - creates superposition
     * H = 1/√2 * [[1, 1], [1, -1]]
     */
    static H(state) {
        const factor = 1 / Math.sqrt(2);
        const newAlpha = state.alpha.add(state.beta).multiply(factor);
        const newBeta = state.alpha.subtract(state.beta).multiply(factor);
        return new QuantumState(newAlpha, newBeta);
    }

    /**
     * Pauli-X gate (NOT gate) - bit flip
     * X = [[0, 1], [1, 0]]
     */
    static X(state) {
        return new QuantumState(state.beta, state.alpha);
    }

    /**
     * Pauli-Y gate - bit + phase flip
     * Y = [[0, -i], [i, 0]]
     */
    static Y(state) {
        const newAlpha = state.beta.multiply(new Complex(0, 1));
        const newBeta = state.alpha.multiply(new Complex(0, -1));
        return new QuantumState(newAlpha, newBeta);
    }

    /**
     * Pauli-Z gate - phase flip
     * Z = [[1, 0], [0, -1]]
     */
    static Z(state) {
        return new QuantumState(
            state.alpha,
            state.beta.multiply(-1)
        );
    }

    /**
     * Rotation around X axis
     * RX(θ) = cos(θ/2)I - i*sin(θ/2)X
     */
    static RX(state, theta) {
        const cos = Math.cos(theta / 2);
        const sin = Math.sin(theta / 2);
        
        const newAlpha = state.alpha.multiply(cos).add(
            state.beta.multiply(new Complex(0, -sin))
        );
        const newBeta = state.beta.multiply(cos).add(
            state.alpha.multiply(new Complex(0, -sin))
        );
        
        return new QuantumState(newAlpha, newBeta);
    }

    /**
     * Rotation around Y axis
     * RY(θ) = [[cos(θ/2), -sin(θ/2)], [sin(θ/2), cos(θ/2)]]
     */
    static RY(state, theta) {
        const cos = Math.cos(theta / 2);
        const sin = Math.sin(theta / 2);
        
        const newAlpha = state.alpha.multiply(cos).subtract(state.beta.multiply(sin));
        const newBeta = state.alpha.multiply(sin).add(state.beta.multiply(cos));
        
        return new QuantumState(newAlpha, newBeta);
    }

    /**
     * Rotation around Z axis
     * RZ(θ) = [[e^(-iθ/2), 0], [0, e^(iθ/2)]]
     */
    static RZ(state, theta) {
        const halfTheta = theta / 2;
        const phase0 = new Complex(Math.cos(-halfTheta), Math.sin(-halfTheta));
        const phase1 = new Complex(Math.cos(halfTheta), Math.sin(halfTheta));
        
        const newAlpha = state.alpha.multiply(phase0);
        const newBeta = state.beta.multiply(phase1);
        
        return new QuantumState(newAlpha, newBeta);
    }

    /**
     * S gate (Phase gate) - 90° phase rotation
     * S = [[1, 0], [0, i]]
     */
    static S(state) {
        return new QuantumState(
            state.alpha,
            state.beta.multiply(new Complex(0, 1))
        );
    }

    /**
     * T gate - 45° phase rotation
     * T = [[1, 0], [0, e^(iπ/4)]]
     */
    static T(state) {
        const phase = new Complex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4));
        return new QuantumState(
            state.alpha,
            state.beta.multiply(phase)
        );
    }
}

/**
 * Quantum Simulator - manages quantum state through a series of gates
 */
export class QuantumSimulator {
    constructor() {
        this.state = new QuantumState(); // Start in |0⟩
        this.history = [this.state.clone()];
    }

    /**
     * Reset to |0⟩ state
     */
    reset() {
        this.state = new QuantumState();
        this.history = [this.state.clone()];
    }

    /**
     * Apply a quantum gate
     */
    applyGate(gateName, theta = null) {
        let newState;

        switch (gateName.toUpperCase()) {
            case 'H':
                newState = QuantumGates.H(this.state);
                break;
            case 'X':
                newState = QuantumGates.X(this.state);
                break;
            case 'Y':
                newState = QuantumGates.Y(this.state);
                break;
            case 'Z':
                newState = QuantumGates.Z(this.state);
                break;
            case 'RX':
                newState = QuantumGates.RX(this.state, theta || 0);
                break;
            case 'RY':
                newState = QuantumGates.RY(this.state, theta || 0);
                break;
            case 'RZ':
                newState = QuantumGates.RZ(this.state, theta || 0);
                break;
            case 'S':
                newState = QuantumGates.S(this.state);
                break;
            case 'T':
                newState = QuantumGates.T(this.state);
                break;
            default:
                console.warn(`Unknown gate: ${gateName}`);
                return;
        }

        this.state = newState;
        this.history.push(this.state.clone());
    }

    /**
     * Get current Bloch sphere coordinates
     */
    getBlochCoordinates() {
        return this.state.toBlochCoordinates();
    }

    /**
     * Get measurement probabilities
     */
    getProbabilities() {
        return {
            prob0: this.state.prob0(),
            prob1: this.state.prob1()
        };
    }

    /**
     * Simulate measurement (collapses state)
     */
    measure() {
        const prob0 = this.state.prob0();
        const result = Math.random() < prob0 ? 0 : 1;
        
        // Collapse to measured state
        if (result === 0) {
            this.state = new QuantumState(new Complex(1, 0), new Complex(0, 0));
        } else {
            this.state = new QuantumState(new Complex(0, 0), new Complex(1, 0));
        }
        
        this.history.push(this.state.clone());
        return result;
    }

    /**
     * Undo last gate operation
     */
    undo() {
        if (this.history.length > 1) {
            this.history.pop();
            this.state = this.history[this.history.length - 1].clone();
        }
    }

    /**
     * Get the current quantum state as a string
     */
    toString() {
        const alpha = this.state.alpha;
        const beta = this.state.beta;
        
        const formatComplex = (c) => {
            const re = c.re.toFixed(3);
            const im = Math.abs(c.im).toFixed(3);
            if (Math.abs(c.im) < 0.001) return re;
            const sign = c.im >= 0 ? '+' : '-';
            return `${re}${sign}${im}i`;
        };

        return `|ψ⟩ = (${formatComplex(alpha)})|0⟩ + (${formatComplex(beta)})|1⟩`;
    }
}
