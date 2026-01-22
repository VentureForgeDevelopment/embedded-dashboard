import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Config for the 'embedded' library build for WordPress
  if (mode === 'embedded') {
    return {
      plugins: [vue()],
      // The 'process' object is not available in browser environments. This 'define' block
      // tells Vite to replace any occurrences of 'process.env' in the code with 'import.meta.env'.
      // This effectively shims the code to use Vite's standard way of accessing environment variables.
      define: {
        // Manually define process.env.NODE_ENV. Vite only does this automatically for 'production'
        // mode. Since our 'embedded' mode is a production build, we must set it explicitly.
        // JSON.stringify is used to ensure it's replaced as a string literal: "production".
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env': 'import.meta.env'
      },
      build: {
        lib: {
          entry: path.resolve(__dirname, 'src/main.js'),
          name: 'WebLinguistDashboard',
          fileName: () => 'web-linguist-dashboard.js',
          formats: ['es']
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
            assetFileNames: (assetInfo) => {
              if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                return 'web-linguist-dashboard.css'
              }
              return assetInfo.name
            }
          }
        }
      }
    }
  }

  // Default config for standard app build (for dashboard.weblinguist.ai)
  return {
    plugins: [vue()],
    // We add the same define block here for consistency across all build types.
    define: {
      // For the default build, Vite's `mode` will be 'production', and for dev it's 'development'.
      // This ensures NODE_ENV is set correctly for both `vite build` and `vite dev`.
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
      'process.env': 'import.meta.env'
    },
    server: {
      host: '0.0.0.0',
      port: 5175,
      watch: {
        usePolling: true
      },
      cors: true,
      allowedHosts: [
        'dashboard.weblinguist.ai',
        'dashboard-alex.devp.weblinguist.ai',
        'dashboard-alexo.devp.weblinguist.ai',
        'dashboard-ross.devp.weblinguist.ai',
        'localhost',
        '.weblinguist.io',
        '.devp.weblinguist.ai'
      ]
    },
    base: '/'
  }
})
