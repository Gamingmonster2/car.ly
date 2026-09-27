import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // مسارات نسبية (./assets/...) حتى يعمل الموقع على GitHub Pages أو أي مجلد فرعي
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // تقسيم المكتبات الثقيلة إلى ملفات منفصلة لتسريع التحميل على شبكات الموبايل
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
