import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 300, // Intervalo de sondeo ajustado
      ignored: ['node_modules/**', 'dist/**'],
    },
    host: true, // Escuchar en todas las interfaces de red
    hmr: {
      // Opciones optimizadas para HMR
      clientPort: 5173,
      host: 'localhost',
      overlay: true,
    },
  },
  // Opciones para optimizar la construcción y recarga
  optimizeDeps: {
    force: false, // No forzar la reoptimización en cada reinicio
  },
  css: {
    devSourcemap: true, // Mapeos para CSS en desarrollo
  },
});
