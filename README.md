# 🌌 Quantum VR - Augmented Reality Quantum Visualization

**Quantum VR** brings quantum computing to life through WebXR and augmented reality. Place giant 3D Bloch spheres in your living room and walk around them to explore quantum states, phase differences, and superposition from every angle.

![Quantum VR Experience](https://img.shields.io/badge/WebXR-AR%20%2B%20VR-purple)
![Mobile Compatible](https://img.shields.io/badge/Mobile-AR%20Ready-green)

## ✨ Features

- 🥽 **WebXR AR Mode**: Place quantum visualizations in your physical space
- 📱 **Mobile AR**: Works on iOS (WebXR Viewer) and Android (Chrome)
- 🎯 **Interactive Bloch Sphere**: 3D visualization of single-qubit quantum states
- 🎮 **Quantum Gates**: Apply H, X, Y, Z gates and watch state evolution in real-time
- 🌐 **Spatial Audio**: Hear quantum phase differences as you move around
- 🎨 **Beautiful 3D Graphics**: Smooth shaders, glow effects, and dynamic lighting

## 🚀 Quick Start

### Prerequisites
- A WebXR-compatible device:
  - **Android**: Chrome browser (v79+)
  - **iOS**: WebXR Viewer app
  - **PC VR**: Oculus Quest, HTC Vive, etc.

### Development

```bash
# Install dependencies
npm install

# Start dev server (HTTPS required for WebXR)
npm run dev
```

Visit `https://localhost:3000` on your device. Accept the self-signed certificate warning.

### Production Build

```bash
npm run build
npm run preview
```

## 📱 How to Use

1. **Enter AR Mode**: Tap the "Enter AR" button
2. **Grant Permissions**: Allow camera and motion sensor access
3. **Place Sphere**: Aim at a flat surface and tap to place the Bloch sphere
4. **Apply Gates**: Use the floating UI to apply quantum gates
5. **Walk Around**: Move physically to see the quantum state from different angles
6. **Multiple Qubits**: Place multiple spheres to visualize entanglement

## 🎓 Understanding the Visualization

### Bloch Sphere Anatomy
- **Purple Dot**: Current quantum state vector
- **Blue Axis (Z)**: |0⟩ (up) to |1⟩ (down)
- **Red/Orange Axes (X, Y)**: Phase and superposition
- **Glow Effect**: Superposition strength

### Quantum Gates
- **H (Hadamard)**: Creates equal superposition
- **X (Pauli-X)**: Bit flip (NOT gate)
- **Y (Pauli-Y)**: Bit + phase flip
- **Z (Pauli-Z)**: Phase flip
- **RX/RY/RZ**: Rotation gates with custom angles

## 🏗️ Architecture

```
quantumVR/
├── src/
│   ├── main.js              # Entry point + Three.js setup
│   ├── QuantumSimulator.js  # Quantum state calculations
│   ├── BlochSphere3D.js     # 3D Bloch sphere mesh + rendering
│   ├── XRManager.js         # WebXR session management
│   └── UI.js                # DOM overlay controls
├── index.html               # App shell
└── styles.css              # UI styling
```

## 🔬 Technical Details

- **Rendering**: Three.js WebGL renderer with XR support
- **Physics Engine**: Custom quantum state simulator (single & multi-qubit)
- **AR Tracking**: WebXR Device API with hit-testing
- **Performance**: Optimized for 60fps on mobile (90fps on VR headsets)

## 🌐 Browser Compatibility

| Platform | Browser | Status |
|----------|---------|--------|
| Android | Chrome 79+ | ✅ Full Support |
| iOS | WebXR Viewer | ✅ AR Support |
| Quest 2/3 | Native Browser | ✅ Full VR |
| Desktop VR | Chrome + SteamVR | ✅ Full VR |

## 📚 Next Steps

- [ ] Multi-qubit entanglement visualization (Bell states, GHZ)
- [ ] Quantum circuit builder in AR space
- [ ] Collaborative multi-user AR sessions
- [ ] Export to QASM and run on real quantum hardware
- [ ] Voice control for hands-free operation

## 🙏 Credits

Built on top of [QuantumMeetsAI](https://github.com/vishalmysore/QuantumStudio) - bringing quantum computing visualization from 2D canvas to immersive 3D AR.

---

**Built with ❤️ for the quantum AR community**
