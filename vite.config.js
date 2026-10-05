import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',                              // нужно для Яндекс Игр: относительные пути
  build: { chunkSizeWarningLimit: 2000 },  // Phaser весит ~1 МБ
});
