import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { config } from "../config/environment"
import api from "../utils/api"

const CACHE_KEY = 'weblinguist_supported_languages'
const COUNTRIES_CACHE_KEY = 'weblinguist_supported_countries'
const CACHE_TIMESTAMP_KEY = 'weblinguist_supported_languages_timestamp'
const COUNTRIES_CACHE_TIMESTAMP_KEY = 'weblinguist_supported_countries_timestamp'
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export const useLanguageStore = defineStore('language', () => {
  // State
  const allLanguages = ref([])
  const allCountries = ref([])
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)

  const appApiUrl = computed(() => config.appApiUrl)

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = () => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!timestamp) return false

    const cacheAge = Date.now() - parseInt(timestamp, 10)
    return cacheAge < CACHE_DURATION_MS
  }

  /**
   * Load languages from localStorage cache
   */
  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY)
      if (cachedData) {
        const parsed = JSON.parse(cachedData)
        if (Array.isArray(parsed) && parsed.length > 0) {
          allLanguages.value = parsed
          initialized.value = true
          return true
        }
      }
    } catch (err) {
      console.error('Error loading languages from cache:', err)
    }
    return false
  }

  /**
   * Save languages to localStorage cache
   */
  const saveToCache = (languages) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(languages))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (err) {
      console.error('Error saving languages to cache:', err)
    }
  }

    /**
   * Check if the countries cache is still valid
   */
  const isCountriesCacheValid = () => {
    const timestamp = localStorage.getItem(COUNTRIES_CACHE_TIMESTAMP_KEY)
    if (!timestamp) return false

    const cacheAge = Date.now() - parseInt(timestamp, 10)
    return cacheAge < CACHE_DURATION_MS
  }

  /**
   * Load countries from localStorage cache
   */
  const loadCountriesFromCache = () => {
    try {
      const cachedData = localStorage.getItem(COUNTRIES_CACHE_KEY)
      if (cachedData) {
        const parsed = JSON.parse(cachedData)
        if (Array.isArray(parsed) && parsed.length > 0) {
          allCountries.value = parsed
          return true
        }
      }
    } catch (err) {
      console.error('Error loading countries from cache:', err)
    }
    return false
  }

  /**
   * Save countries to localStorage cache
   */
  const saveCountriesToCache = (countries) => {
    try {
      localStorage.setItem(COUNTRIES_CACHE_KEY, JSON.stringify(countries))
      localStorage.setItem(COUNTRIES_CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (err) {
      console.error('Error saving countries to cache:', err)
    }
  }

  /**
   * Clear the country cache
   */
  const clearCountryCache = () => {
    localStorage.removeItem(COUNTRIES_CACHE_KEY)
    localStorage.removeItem(COUNTRIES_CACHE_TIMESTAMP_KEY)
    allCountries.value = []
  }

  /**
   * Fetch supported languages from the API
   */
  const fetchSupportedLanguages = async (forceRefresh = false) => {
    // If already initialized and not forcing refresh, return
    if (initialized.value && !forceRefresh) {
      return
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh && isCacheValid() && loadFromCache()) {
      console.log('Loaded languages from cache')
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await api.get(`${appApiUrl.value}languages`)

      if (response.data.success && Array.isArray(response.data.languages)) {
        // Filter out 'auto' from frontend display (backend-only language)
        allLanguages.value = response.data.languages
          .filter(lang => lang.code !== 'auto')
          .map(lang => ({
            code: lang.code,
            name: lang.name, // The name of the language
            flag: lang.flag, // The SVG flag
            phone_code: lang.phone_code ? lang.phone_code : null,
          }))

        // Save to cache
        saveToCache(allLanguages.value)
        initialized.value = true

        console.log(`Loaded ${allLanguages.value.length} languages from API`)
      } else {
        throw new Error('Invalid response format from API')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch supported languages'
      console.error('Error fetching supported languages:', err)

      // Try to load from cache as fallback (even if stale)
      if (!loadFromCache()) {
        // Ultimate fallback: minimal set of common languages with BCP 47 codes
        allLanguages.value = [
          { code: 'en-US', name: 'English (United States)', flag: null },
          { code: 'es-ES', name: 'Spanish (Spain)', flag: null },
          { code: 'fr-FR', name: 'French (France)', flag: null },
          { code: 'de-DE', name: 'German (Germany)', flag: null },
          { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: null },
          { code: 'it-IT', name: 'Italian (Italy)', flag: null },
          { code: 'ja', name: 'Japanese', flag: null },
          { code: 'zh-Hans', name: 'Simplified Chinese', flag: null },
        ]
        console.warn('Using fallback languages')
      } else {
        console.log('Loaded stale cache as fallback')
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch supported countries from the API
   */
  const fetchSupportedCountries = async (forceRefresh = false) => {
    // If already loaded and not forcing refresh, return
    if (allCountries.value.length > 0 && !forceRefresh) {
      return
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh && isCountriesCacheValid() && loadCountriesFromCache()) {
      console.log('Loaded countries from cache')
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await api.get(`${appApiUrl.value}languages/countries`)

      if (response.data.success && Array.isArray(response.data.countries)) {
        allCountries.value = response.data.countries
        saveCountriesToCache(allCountries.value)
        console.log(`Loaded ${allCountries.value.length} countries from API`)
      } else {
        throw new Error('Invalid response format for countries from API')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch supported countries'
      console.error('Error fetching supported countries:', err)
      // Attempt to load from stale cache as a fallback
      loadCountriesFromCache()
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear the language cache (useful for testing or forcing refresh)
   */
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
    allLanguages.value = []
    initialized.value = false
  }

  // Map of base language codes to flag emojis
  const languageFlags = {
    'af': '🇿🇦',
    'sq': '🇦🇱',
    'am': '🇪🇹',
    'ar': '🇸🇦',
    'hy': '🇦🇲',
    'az': '🇦🇿',
    'eu': '🇪🇸',
    'be': '🇧🇾',
    'bn': '🇧🇩',
    'bs': '🇧🇦',
    'bg': '🇧🇬',
    'ca': '🇪🇸',
    'yue': '🇭🇰',
    'zh': '🇨🇳',
    'zh-hans': '🇨🇳',
    'zh-hant': '🇹🇼',
    'zh-cn': '🇨🇳',
    'zh-tw': '🇹🇼',
    'hr': '🇭🇷',
    'cs': '🇨🇿',
    'da': '🇩🇰',
    'nl': '🇳🇱',
    'en': '🇬🇧',
    'et': '🇪🇪',
    'fi': '🇫🇮',
    'fr': '🇫🇷',
    'gl': '🇪🇸',
    'ka': '🇬🇪',
    'de': '🇩🇪',
    'el': '🇬🇷',
    'gu': '🇮🇳',
    'ht': '🇭🇹',
    'ha': '🇳🇬',
    'he': '🇮🇱',
    'hi': '🇮🇳',
    'hu': '🇭🇺',
    'is': '🇮🇸',
    'id': '🇮🇩',
    'ga': '🇮🇪',
    'it': '🇮🇹',
    'ja': '🇯🇵',
    'jv': '🇮🇩',
    'kn': '🇮🇳',
    'kk': '🇰🇿',
    'ko': '🇰🇷',
    'ku': '🇮🇶',
    'ky': '🇰🇬',
    'lo': '🇱🇦',
    'la': '🇻🇦',
    'lv': '🇱🇻',
    'lt': '🇱🇹',
    'lb': '🇱🇺',
    'mk': '🇲🇰',
    'ms': '🇲🇾',
    'ml': '🇮🇳',
    'mt': '🇲🇹',
    'mi': '🇳🇿',
    'mr': '🇮🇳',
    'mn': '🇲🇳',
    'my': '🇲🇲',
    'ne': '🇳🇵',
    'no': '🇳🇴',
    'nb': '🇳🇴',
    'fa': '🇮🇷',
    'pl': '🇵🇱',
    'pt': '🇵🇹',
    'pt-br': '🇧🇷',
    'pa': '🇮🇳',
    'ro': '🇷🇴',
    'ru': '🇷🇺',
    'sr': '🇷🇸',
    'si': '🇱🇰',
    'sk': '🇸🇰',
    'sl': '🇸🇮',
    'so': '🇸🇴',
    'es': '🇪🇸',
    'sw': '🇰🇪',
    'sv': '🇸🇪',
    'tl': '🇵🇭',
    'ta': '🇮🇳',
    'te': '🇮🇳',
    'th': '🇹🇭',
    'tr': '🇹🇷',
    'uk': '🇺🇦',
    'ur': '🇵🇰',
    'uz': '🇺🇿',
    'vi': '🇻🇳',
    'cy': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'xh': '🇿🇦',
    'yi': '🇮🇱',
    'yo': '🇳🇬',
    'zu': '🇿🇦',
  }

  /**
   * Normalize a language code to its base form for flag lookup
   * Accepts both BCP 47 (en-US, zh-Hans) and lowercase (en-us, zh-hans) formats
   * E.g., "en-US" or "en-us" -> "en", "es-MX" or "es-mx" -> "es"
   */
  const normalizeLanguageCode = (code) => {
    if (!code) return ''

    // Normalize to lowercase for comparison
    const lowerCode = code.toLowerCase()

    // Special cases that should not be normalized (region-specific or script-based)
    // Accept both BCP 47 and lowercase formats
    const specialCases = ['pt-br', 'zh-hans', 'zh-hant', 'zh-cn', 'zh-tw', 'sr-latn']
    if (specialCases.includes(lowerCode)) {
      return lowerCode
    }

    // Split on dash and return the first part (base language)
    return lowerCode.split('-')[0]
  }

  /**
   * Get the flag emoji for a language code
   * Accepts both BCP 47 (en-US) and lowercase (en-us) formats
   * Automatically normalizes locale variants to their base code
   */
  const getLanguageFlag = (code) => {
    if (!code) return '🌐'

    // Normalize to lowercase for flag lookup
    const lowerCode = code.toLowerCase()

    // Try exact match first (for special cases like zh-hans)
    if (languageFlags[lowerCode]) {
      return languageFlags[lowerCode]
    }

    // Try normalized base code
    const normalized = normalizeLanguageCode(code)
    return languageFlags[normalized] || '🌐'
  }

  /**
   * Get language object by code
   * Performs case-insensitive matching to support both BCP 47 and lowercase formats
   */
  const getLanguageByCode = (code) => {
    if (!code) return null
    const lowerCode = code.toLowerCase()
    return allLanguages.value.find(lang => lang.code.toLowerCase() === lowerCode) || null
  }

  return {
    // State
    allLanguages,
    loading,
    error,
    initialized,
    allCountries,

    // Actions
    fetchSupportedLanguages,
    fetchSupportedCountries,
    clearCache,

    // Computed/Helpers
    languageFlags,
    normalizeLanguageCode,
    getLanguageFlag,
    getLanguageByCode
  }
})
