import { defineConfig } from 'vite';

export default defineConfig({
  base: '/QuantumStudioVR/',
  server: {
    port: 3000,
    host: '0.0.0.0', // Expose on all network interfaces
    https: false, // We'll use ngrok for HTTPS tunnel instead
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  }
});
