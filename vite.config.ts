import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      // Keep the engine cached when game code changes.
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
