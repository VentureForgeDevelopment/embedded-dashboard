import { defineStore } from "pinia"
import { ref, watch, computed } from "vue"

export const useThemeStore = defineStore("theme", () => {

  const isEmbedded = computed(() => {
    return window.WebLinguistDashboard?.isEmbedded == 1
  })

  // Default to light mode (dark mode temporarily disabled)
  const isDarkMode = ref(false)
  const modalOpen = ref(false)

  // Apply theme to document
  const applyTheme = () => {
    if (isDarkMode.value) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
  }

  const toggleModal = () => {
    modalOpen.value = !modalOpen.value
  }

  const closeModal = () => {
    modalOpen.value = false
  }

  // Watch for changes and persist to localStorage
  watch(isDarkMode, (newValue) => {
    localStorage.setItem("darkMode", newValue.toString())
    applyTheme()
  })

  // Apply theme on initialization
  applyTheme()

  return {
    isEmbedded,
    isDarkMode,
    toggleDarkMode,
    applyTheme,
    modalOpen,
    toggleModal,
    closeModal,
  }
})
