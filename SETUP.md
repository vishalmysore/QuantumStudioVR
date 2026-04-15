# 🚀 Quantum VR - Setup Guide

Complete guide to running Quantum VR on your phone or VR device.

## 📋 Prerequisites

### For Android Phones
- **Chrome Browser** version 79 or newer
- Android 7.0 (Nougat) or higher
- ARCore support (most modern Android phones)
  - Check compatibility: https://developers.google.com/ar/devices

### For iPhone/iPad
- **WebXR Viewer** app (free from App Store)
  - Download: https://apps.apple.com/us/app/webxr-viewer/id1295998056
- iOS 11 or higher

### For VR Headsets
- Oculus Quest 1/2/3/Pro (native browser)
- HTC Vive / Valve Index (Chrome + SteamVR)
- Windows Mixed Reality headsets

## 🛠️ Installation & Development

### 1. Clone and Install

```bash
cd quantumVR
npm install
```

### 2. Run Development Server

WebXR requires HTTPS, even in development. Vite is pre-configured for this:

```bash
npm run dev
```

You'll see output like:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   https://localhost:3000/
➜  Network: https://192.168.1.x:3000/
```

### 3. Access on Your Phone

**Option A: Local Network Access (Recommended)**
1. Make sure your phone is on the **same WiFi network** as your computer
2. Note the **Network URL** from Vite output (e.g., `https://192.168.1.5:3000`)
3. On your phone, open Chrome and navigate to that URL
4. You'll see a security warning about the self-signed certificate
   - Android Chrome: Click "Advanced" → "Proceed to [address] (unsafe)"
   - iOS WebXR Viewer: Tap "Continue"

**Option B: USB Debugging (Android)**
1. Enable USB debugging on your phone
2. Connect phone to computer via USB
3. In Chrome on computer, go to `chrome://inspect`
4. Click "Port forwarding" and forward `3000` to `localhost:3000`
5. On phone, navigate to `localhost:3000`

**Option C: Tunneling (ngrok)**
```bash
# Install ngrok
npm install -g ngrok

# In a new terminal, while dev server is running
ngrok http 3000
```
Use the `https://` URL provided by ngrok on your phone.

## 📱 Testing on Different Devices

### Android Phone
1. Open **Chrome**
2. Navigate to your development URL
3. Accept certificate warning
4. Tap **"Enter AR"** button
5. Grant camera permissions when prompted
6. Point at a flat surface (floor, table)
7. Tap screen to place Bloch sphere

### iPhone (WebXR Viewer)
1. Download **WebXR Viewer** from App Store
2. Open the app and navigate to your URL
3. Tap **"Enter AR"**
4. Follow AR placement instructions

### Oculus Quest
1. Open the built-in **Browser**
2. Navigate to your URL (use Network URL)
3. Click **"Enter VR"** (AR mode may vary by model)
4. Use controllers to place and interact

## 🏗️ Building for Production

### 1. Build the Project

```bash
npm run build
```

This creates optimized files in the `dist/` folder.

### 2. Preview Production Build

```bash
npm run preview
```

### 3. Deploy Options

#### GitHub Pages
```bash
# Add to vite.config.js
base: '/quantumVR/'

# Build and push to gh-pages branch
npm run build
```

Then deploy the `dist/` folder to GitHub Pages.

#### Netlify/Vercel
Simply drag the `dist/` folder to Netlify or connect your GitHub repo to Vercel.

#### Self-Hosted
Copy `dist/` contents to your web server. **Ensure HTTPS is configured** - WebXR won't work over HTTP.

## 🔧 Troubleshooting

### "WebXR not supported" Error

**Cause**: Browser or device doesn't support WebXR AR
**Solutions**:
- Update Chrome to latest version (Android)
- Use WebXR Viewer app (iOS)
- Check device compatibility at https://immersiveweb.dev/

### Certificate Errors in Development

**Cause**: Self-signed certificate from Vite
**Solution**: This is normal for local development. Click "Advanced" → "Proceed anyway"

### Camera Permission Denied

**Cause**: Browser blocked camera access
**Solutions**:
- Chrome Android: Site Settings → Camera → Allow
- Clear site data and reload
- Check system camera permissions in Android Settings

### Sphere Not Placing

**Cause**: No flat surface detected
**Solutions**:
- Point at a real flat surface (not a screen)
- Ensure good lighting
- Move phone slowly
- Try a textured surface (patterned floor works better than solid white)

### Performance Issues

**Solutions**:
- Close other browser tabs
- Reduce sphere detail (edit `BlochSphere3D.js` geometry segments)
- Disable trail effect for older devices

### HTTPS Required Error

**Cause**: Accessing via HTTP in production
**Solution**: WebXR **requires HTTPS**. Get a free certificate from Let's Encrypt or use a service like Netlify/Vercel.

## 🧪 Testing Features

### Basic Quantum Gates
1. Place sphere in AR
2. Tap **H** (Hadamard) to create superposition
   - Purple dot moves to equator
3. Tap **X** to flip bit
   - Dot moves from top to bottom
4. Tap **Z** to flip phase
   - Dot moves around equator

### Rotation Gates
1. Use slider to set angle (e.g., 45°)
2. Tap **RX**, **RY**, or **RZ**
3. Watch smooth rotation around selected axis

### Measurement
1. Create superposition with **H** gate
2. Tap **Measure**
3. State collapses to either |0⟩ or |1⟩
4. Repeat to see probabilistic nature

### Walking Around
1. Place sphere on floor
2. Physically walk around it
3. Observe phase/amplitude from different angles
4. Crouch down to see underneath

## 🌐 Network Configuration

### Firewall Rules
If your phone can't connect to the dev server, allow port 3000:

**Windows Firewall**:
```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**macOS Firewall**:
System Preferences → Security & Privacy → Firewall → Firewall Options → Allow Node.js

**Linux (ufw)**:
```bash
sudo ufw allow 3000/tcp
```

### Using Custom Port
Edit `vite.config.js`:
```javascript
server: {
  port: 8080,  // Change this
  https: true
}
```

## 📚 Additional Resources

- **WebXR Device API**: https://immersiveweb.dev/
- **Three.js Docs**: https://threejs.org/docs/
- **Quantum Computing Basics**: https://quantum-computing.ibm.com/
- **ARCore Devices**: https://developers.google.com/ar/devices

## 🆘 Still Having Issues?

1. Check browser console for errors (F12 → Console)
2. Verify HTTPS is working (look for 🔒 in address bar)
3. Test on https://immersive-web.github.io/webxr-samples/ first
4. Try a different device/browser

---

**Happy Quantum AR Exploring! 🌌⚛️**
