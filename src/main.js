import { createApp } from "vue"
import { createPinia } from "pinia"
import { createRouterInstance } from "./router"
import "./style.css"
import App from "./App.vue"
import axios from "axios"
import I18nPlugin from "./lib/i18n/plugin.js"

axios.defaults.withCredentials = true

function initializeApp() {
  // Determine context by first checking for the reliable wp_localize_script object.
  // As a fallback, check for the data-context attribute on the root element.
  // This makes the app robust enough to mount correctly even if the localized object fails to inject.
  const embeddedObject = window.WebLinguistDashboard

  // Create the router instance based on the context.
  const router = createRouterInstance(embeddedObject)

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)
  app.use(I18nPlugin, {
    licenseKey: import.meta.env.VITE_WL_APP_LICENSE_KEY,
    cdnUrl: import.meta.env.VITE_WL_CDN_URL || 'https://weblinguist-cache.sfo3.digitaloceanspaces.com',
    apiUrl: import.meta.env.VITE_WL_API_URL || 'https://api.weblinguist.ai',
    sourceLanguage: 'en',
    targetLanguages: ['fr', 'es', 'it', 'pt', 'ro']
  })

  app.mount("#app")
}

// Defer app initialization until the DOM is fully loaded.
// This prevents a race condition and ensures that the `<div id="app">` and any
// data from `wp_localize_script` are available before the Vue app tries to access them.
document.addEventListener('DOMContentLoaded', initializeApp);
