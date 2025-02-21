import { defineConfig } from 'vite'

export default defineConfig({
  // Define the root directory for Vite to serve the project
  root: './', // This makes sure the server serves from the current directory
  base: '/saturn/',
  build: {
    // Output the compiled files to the dist directory
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true // Optional: Enable sourcemaps for easier debugging
  },

  server: {
    open: true, // Automatically open the browser when the server starts
    port: 3000 // You can change the port if needed
  }
})
