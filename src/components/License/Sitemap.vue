<template>
  <div class="sitemap-page" :class="{ 'is-loading': loading }">
    <SlideInNotification
      :show="showSuccessNotification"
      :message="successMessage"
      type="success"
    />
    <SlideInNotification
      :show="showErrorNotification"
      :message="errorMessage"
      type="error"
    />

    <!-- Header -->
    <div class="sitemap-header">
      <h3 class="section-title">Sitemap Manager</h3>
      <p class="sitemap-description">
        Manage your sitemap URLs, translated slugs, and download sitemaps in HTML or XML format.
      </p>
    </div>

    <!-- Sitemap Status Bar -->
    <div class="sitemap-status-bar">
      <div class="status-info">
        <span v-if="sitemapGeneratedAt" class="last-built">
          Last built: {{ formatDateTime(sitemapGeneratedAt) }}
        </span>
        <span v-if="regenerationStatus?.status === 'regenerating'" class="status-badge regenerating">
          <Refresh class="status-icon spinning" />
          Regenerating...
        </span>
        <span v-else-if="regenerationStatus?.status === 'pending'" class="status-badge pending">
          <ClockOutline class="status-icon" />
          Pending ({{ regenerationStatus.regenerate_in_seconds }}s)
        </span>
      </div>
      <button
        class="btn btn-small btn-outline"
        @click="triggerRegeneration"
        :disabled="regenerating || regenerationStatus?.status === 'regenerating'"
      >
        <Refresh class="btn-icon" :class="{ spinning: regenerating }" />
        <span>Regenerate Now</span>
      </button>
    </div>

    <!-- Settings Toggle (for use_translated_urls) -->
    <div class="settings-bar">
      <div class="setting-toggle">
        <div class="toggle-row">
          <label class="switch">
            <input
              type="checkbox"
              v-model="useTranslatedUrls"
              @change="updateTranslatedUrlsSetting"
              :disabled="updatingSettings"
            />
            <span class="slider"></span>
          </label>
          <span class="toggle-text">Use Translated URL Slugs</span>
        </div>
        <p class="settings-help">
          <strong>Translated URL slugs</strong> provide SEO-friendly URLs for each language
          (e.g., <code>/contact</code> → <code>/fr/contactez</code>).
        </p>
      </div>
    </div>

    <div class="main-grid">
      <!-- URL Management Section -->
      <div class="overview-card">
        <div class="card-header">
          <div class="header-with-subtitle">
            <h2>Manage Pages</h2>
            <span class="domain-subtitle">{{ licenseDomain }}</span>
          </div>
          <button
            @click="showAddForm = !showAddForm"
            class="btn btn-primary btn-small"
          >
            <Plus class="btn-icon" />
            <span>Add Page</span>
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="sitemap-filter-group">
            <div class="filter-label">Filter:</div>
            <div class="filter-buttons">
              <button
                class="btn btn-outline btn-small"
                :class="{ active: pageFilter === 'all' }"
                @click="pageFilter = 'all'"
              >
                All Pages
              </button>
              <button
                class="btn btn-outline btn-small"
                :class="{ active: pageFilter === 'excluded' }"
                @click="pageFilter = 'excluded'"
              >
                Excluded
              </button>
              <button
                class="btn btn-outline btn-small"
                :class="{ active: pageFilter === 'manual' }"
                @click="pageFilter = 'manual'"
              >
                Manual
              </button>
            </div>
          </div>
        </div>

        <!-- Search Box -->
        <div class="search-and-stats">
          <div class="search-box">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search URLs..."
              class="search-input"
            />
          </div>
          <div class="filter-stats">
            Showing {{ paginatedPages.length }} of {{ totalFilteredPages }} pages
          </div>
        </div>

        <div class="card-body scrollable">
          <!-- Add URL Form -->
          <div v-if="showAddForm" class="add-form">
            <h3>Add New Page</h3>
            <div class="form-group">
              <label>URL Path</label>
              <input
                type="text"
                v-model="newPageForm.url"
                placeholder="/about-us"
                class="input"
              />
            </div>
            <div class="form-group">
              <label>Page Title (optional)</label>
              <input
                type="text"
                v-model="newPageForm.title"
                placeholder="About Us"
                class="input"
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Change Frequency</label>
                <select v-model="newPageForm.changefreq" class="input">
                  <option value="always">Always</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <div class="form-group">
                <label>Priority ({{ newPageForm.priority }})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  v-model.number="newPageForm.priority"
                  class="range-input"
                />
              </div>
            </div>
            <div class="button-row">
              <button @click="handleAddPage" class="btn btn-primary" :disabled="addingPage">
                {{ addingPage ? 'Adding...' : 'Add Page' }}
              </button>
              <button @click="showAddForm = false" class="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading sitemap data...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="pages.length === 0 && !loading" class="empty-state">
            <p>No pages found. Start a crawl or add pages manually.</p>
          </div>

          <!-- Page List -->
          <div v-else class="page-list">
            <TransitionGroup name="page-row" tag="div">
              <div
                v-for="page in paginatedPages"
                :key="page.hash"
                class="page-item"
                :class="{
                  'is-excluded': page.excluded,
                  'is-dirty': dirtyPages[page.hash],
                  'is-saving': savingPages[page.hash]
                }"
              >
                <!-- View Mode -->
                <div class="page-header">
                  <div class="page-url">
                    <code class="url-text">{{ getPathFromUrl(page.url) }}</code>
                    <span v-if="page.source === 'manual'" class="source-badge manual">
                      manual
                    </span>
                  </div>
                  <div class="action-buttons">
                    <button
                      v-if="dirtyPages[page.hash]"
                      @click="savePage(page)"
                      class="icon-btn icon-btn-save"
                      title="Save changes"
                      :disabled="savingPages[page.hash]"
                    >
                      <ContentSave v-if="!savingPages[page.hash]" />
                      <span v-else class="mini-spinner"></span>
                    </button>
                    <button
                      @click="toggleExpanded(page.hash)"
                      class="icon-btn"
                      :class="{ 'icon-btn-disabled': page.excluded }"
                      :title="page.excluded ? 'Enable page to edit translations' : (expandedPages[page.hash] ? 'Collapse' : 'Edit URL translations')"
                      :disabled="page.excluded"
                    >
                      <ChevronDown v-if="!expandedPages[page.hash]" />
                      <ChevronUp v-else />
                    </button>
                    <button
                      @click="toggleExcluded(page)"
                      class="icon-btn"
                      :class="{ 'icon-btn-excluded': page.excluded }"
                      :title="page.excluded ? 'Include in sitemap' : 'Exclude from sitemap'"
                      :disabled="togglingExcluded[page.hash]"
                    >
                      <span v-if="togglingExcluded[page.hash]" class="mini-spinner"></span>
                      <EyeOff v-else-if="page.excluded" />
                      <Eye v-else />
                    </button>
                    <button
                      v-if="page.source === 'manual'"
                      @click="handleDeletePage(page)"
                      class="icon-btn icon-btn-danger"
                      title="Delete page"
                    >
                      <Delete />
                    </button>
                  </div>
                </div>

                <div class="page-title" v-if="page.title">
                  {{ page.title }}
                </div>

                <div class="page-meta">
                  <span class="badge">{{ page.changefreq || 'weekly' }}</span>
                  <span class="badge badge-primary">Priority: {{ page.priority || calculatePriority(page.url) }}</span>
                  <span class="badge" v-if="page.lastmod">{{ formatDate(page.lastmod) }}</span>
                </div>

                <!-- Expanded URL Translations Editor (hidden when excluded) -->
                <div v-if="expandedPages[page.hash] && !page.excluded" class="translations-expanded">
                  <div class="translations-header">
                    <h4>URL Translations</h4>
                    <button
                      @click="generateAllSlugs(page)"
                      class="btn btn-small btn-outline"
                      :disabled="generatingAll[page.hash]"
                      title="Generate translations for all languages using AI"
                    >
                      <Refresh class="btn-icon" :class="{ spinning: generatingAll[page.hash] }" />
                      <span>Generate All</span>
                    </button>
                  </div>
                  <div
                    v-for="lang in languages"
                    :key="getLangCode(lang)"
                    class="translation-row"
                  >
                    <span class="lang-label">{{ getLangCode(lang).toUpperCase() }}:</span>
                    <div class="url-input-wrapper">
                      <span class="domain-prefix">https://{{ licenseDomain }}/{{ getLangCode(lang) }}</span>
                      <input
                        type="text"
                        :value="getPathWithoutLangPrefix(getLocalTranslations(page)[getLangCode(lang)], getLangCode(lang))"
                        @input="updateTranslationPath(page, getLangCode(lang), $event.target.value)"
                        class="input path-input"
                        :placeholder="getPathFromUrl(page.url)"
                      />
                    </div>
                    <button
                      @click="generateSlug(page, getLangCode(lang))"
                      class="icon-btn"
                      :disabled="generatingSlugs[`${page.hash}:${getLangCode(lang)}`]"
                      title="Generate with AI"
                    >
                      <Refresh :class="{ spinning: generatingSlugs[`${page.hash}:${getLangCode(lang)}`] }" />
                    </button>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="card-footer" v-if="totalPages > 1">
          <div class="pagination-controls">
            <button
              @click="currentPage = 1"
              :disabled="currentPage === 1"
              class="btn btn-secondary btn-small"
            >
              First
            </button>
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="btn btn-secondary btn-small"
            >
              Previous
            </button>
            <span class="pagination-info">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="btn btn-secondary btn-small"
            >
              Next
            </button>
            <button
              @click="currentPage = totalPages"
              :disabled="currentPage === totalPages"
              class="btn btn-secondary btn-small"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      <!-- Source Section -->
      <div class="overview-card">
        <div class="card-header">
          <h2>Sitemap Source</h2>
          <div class="format-buttons">
            <button
              @click="selectFormat('xml')"
              :class="['btn', 'btn-small', format === 'xml' ? 'btn-primary' : 'btn-outline']"
            >
              <Code class="btn-icon" />
              <span>XML</span>
            </button>
            <button
              @click="selectFormat('html')"
              :class="['btn', 'btn-small', format === 'html' ? 'btn-primary' : 'btn-outline']"
            >
              <FileDocument class="btn-icon" />
              <span>HTML</span>
            </button>
          </div>
        </div>

        <div class="card-header format-header">
          <div class="sitemap-info">
            <span class="info-badge">{{ sourcePageCount }} pages</span>
            <span class="info-badge">{{ languages.length }} languages</span>
            <!-- Language selector for HTML -->
            <select
              v-if="format === 'html' && languages.length > 0"
              v-model="selectedSourceLang"
              @change="fetchSourceContent"
              class="lang-select"
            >
              <option v-for="lang in languages" :key="getLangCode(lang)" :value="getLangCode(lang)">
                {{ getLangCode(lang).toUpperCase() }}
              </option>
            </select>
          </div>
          <div class="action-buttons">
            <button @click="handleCopy" class="btn btn-small btn-outline" :disabled="sourceLoading || !sourceContent">
              <ContentCopy v-if="!copied" class="btn-icon" />
              <Check v-else class="btn-icon icon-success" />
              <span>{{ copied ? "Copied!" : "Copy" }}</span>
            </button>
            <button @click="handleDownload" class="btn btn-small btn-primary" :disabled="sourceLoading || !sourceContent">
              <Download v-if="!downloaded" class="btn-icon" />
              <Check v-else class="btn-icon" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <!-- Source Area -->
        <div class="card-body">
          <div class="preview-header">
            <h3>Source</h3>
            <span class="line-count" v-if="!sourceLoading && sourceContent">{{ sourceLineCount }} lines</span>
          </div>

          <div class="code-preview">
            <div class="code-header">
              <span class="filename">{{ sourceFilename }}</span>
              <div class="window-dots">
                <div class="dot dot-red"></div>
                <div class="dot dot-yellow"></div>
                <div class="dot dot-green"></div>
              </div>
            </div>
            <div v-if="sourceLoading" class="code-loading">
              <div class="spinner"></div>
              <span>Loading source...</span>
            </div>
            <div v-else-if="sourceError" class="code-error">
              <span>{{ sourceError }}</span>
            </div>
            <pre v-else class="code-content"><code :class="`language-${format}`" v-html="highlightedCode"></code></pre>
          </div>
        </div>

        <!-- Sitemap Files from S3 -->
        <div v-if="sitemaps && Object.keys(sitemaps).length > 0" class="sitemap-files">
          <h4>Generated Sitemap Files</h4>
          <div class="sitemap-links">
            <!-- Single XML Sitemap -->
            <div v-if="sitemaps._xml?.url" class="sitemap-lang-group">
              <span class="lang-label">XML:</span>
              <a :href="sitemaps._xml.url" target="_blank" class="sitemap-link">
                sitemap.xml ({{ sitemaps._xml.page_count || 0 }} pages)
              </a>
            </div>
            <!-- HTML Sitemaps per language -->
            <div v-for="(files, lang) in languageSitemaps" :key="lang" class="sitemap-lang-group">
              <span class="lang-label">{{ lang.toUpperCase() }}:</span>
              <a v-if="files.html?.url" :href="files.html.url" target="_blank" class="sitemap-link">
                HTML ({{ files.html.page_count || 0 }} pages)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from "vue"
import { onBeforeRouteLeave } from "vue-router"
import api from "../../utils/api"
import { config } from "../../config/environment"
import { useAuthStore } from "../../stores/auth"
import SlideInNotification from "../SlideInNotification.vue"
import hljs from "highlight.js"
import "highlight.js/styles/atom-one-dark.css"

// Icons
import Plus from "vue-material-design-icons/Plus.vue"
import ContentSave from "vue-material-design-icons/ContentSave.vue"
import Delete from "vue-material-design-icons/Delete.vue"
import Eye from "vue-material-design-icons/Eye.vue"
import EyeOff from "vue-material-design-icons/EyeOff.vue"
import ChevronDown from "vue-material-design-icons/ChevronDown.vue"
import ChevronUp from "vue-material-design-icons/ChevronUp.vue"
import Refresh from "vue-material-design-icons/Refresh.vue"
import ContentCopy from "vue-material-design-icons/ContentCopy.vue"
import Download from "vue-material-design-icons/Download.vue"
import Check from "vue-material-design-icons/Check.vue"
import Code from "vue-material-design-icons/CodeTags.vue"
import FileDocument from "vue-material-design-icons/FileDocument.vue"
import ClockOutline from "vue-material-design-icons/ClockOutline.vue"
import CheckCircle from "vue-material-design-icons/CheckCircle.vue"

const authStore = useAuthStore()

const props = defineProps({
  license_id: {
    type: [String, Number],
    required: false,
    default: null,
  },
  license: {
    type: Object,
    required: false,
    default: null,
  },
})

// Derive license ID from prop or license object
const licenseId = computed(() => {
  if (props.license_id) return props.license_id
  if (props.license?.id) return props.license.id
  return null
})

// State
const loading = ref(false)
const pages = ref([])
const metadata = ref({})
const sitemaps = ref({})
const regenerationStatus = ref(null)
const useTranslatedUrls = ref(false)
const sourceLanguage = ref('en')
const languages = ref([])
const domain = ref('')

// UI State
const showAddForm = ref(false)
const searchQuery = ref("")
const pageFilter = ref("all")
const currentPage = ref(1)
const itemsPerPage = ref(10)
const format = ref("xml")
const copied = ref(false)
const downloaded = ref(false)

// Source fetching state
const sourceContent = ref("")
const sourceLoading = ref(false)
const sourceError = ref("")
const selectedSourceLang = ref("")

// Expanded pages state
const expandedPages = reactive({})

// Dirty tracking
const dirtyPages = reactive({})
const localTranslations = reactive({})

// Saving states
const savingPages = reactive({})
const generatingSlugs = reactive({})
const generatingAll = reactive({})
const togglingExcluded = reactive({})
const addingPage = ref(false)
const updatingSettings = ref(false)
const regenerating = ref(false)

// Notifications
const showSuccessNotification = ref(false)
const showErrorNotification = ref(false)
const successMessage = ref("Success!")
const errorMessage = ref("An error occurred")

// New page form
const newPageForm = ref({
  url: "",
  title: "",
  changefreq: "weekly",
  priority: 0.5,
})

// Computed
const filteredPages = computed(() => {
  let filtered = pages.value

  // Page filter
  if (pageFilter.value === "excluded") {
    filtered = filtered.filter((page) => page.excluded)
  } else if (pageFilter.value === "manual") {
    filtered = filtered.filter((page) => page.source === "manual")
  }

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (page) =>
        page.url?.toLowerCase().includes(query) ||
        page.title?.toLowerCase().includes(query) ||
        Object.values(page.url_translations || {}).some((url) =>
          url?.toLowerCase().includes(query)
        )
    )
  }

  return filtered
})

const totalFilteredPages = computed(() => filteredPages.value.length)

const totalPages = computed(() =>
  Math.ceil(filteredPages.value.length / itemsPerPage.value)
)

const paginatedPages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredPages.value.slice(start, start + itemsPerPage.value)
})

const sourceLineCount = computed(() => {
  if (!sourceContent.value) return 0
  return sourceContent.value.split("\n").length
})

const sourceFilename = computed(() => {
  if (format.value === "xml") {
    return "sitemap.xml"
  }
  return `sitemap-${selectedSourceLang.value || 'en'}.html`
})

// Get generated_at timestamp from the API response
const sitemapGeneratedAt = computed(() => {
  return metadata.value?.generated_at || null
})

// Get page count from sitemap metadata (actual count in the generated files)
const sourcePageCount = computed(() => {
  if (format.value === "xml") {
    return sitemaps.value._xml?.page_count || 0
  }
  const lang = selectedSourceLang.value
  return sitemaps.value[lang]?.html?.page_count || 0
})

const highlightedCode = computed(() => {
  if (!sourceContent.value) return ''
  const lang = format.value === 'xml' ? 'xml' : 'html'
  return hljs.highlight(sourceContent.value, { language: lang }).value
})

const hasUnsavedChanges = computed(() => {
  return Object.keys(dirtyPages).some((hash) => dirtyPages[hash])
})

// Filter sitemaps to only show language-specific entries (exclude _xml)
const languageSitemaps = computed(() => {
  const result = {}
  for (const [key, value] of Object.entries(sitemaps.value)) {
    if (key !== '_xml') {
      result[key] = value
    }
  }
  return result
})

// Watch for filter changes to reset pagination
watch([pageFilter, searchQuery], () => {
  currentPage.value = 1
})

// Navigation guard
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

// Methods
function hasTranslations(page) {
  return (
    page.url_translations &&
    Object.keys(page.url_translations).length > 0 &&
    Object.values(page.url_translations).some((v) => v)
  )
}

// Extract just the path from a URL (handles both full URLs and paths)
function getPathFromUrl(url) {
  if (!url) return '/'
  try {
    // If it's a full URL, extract the path
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url)
      return urlObj.pathname || '/'
    }
    // Already a path
    return url.startsWith('/') ? url : `/${url}`
  } catch {
    return url.startsWith('/') ? url : `/${url}`
  }
}

// Get path without the language prefix (for display in edit input)
function getPathWithoutLangPrefix(url, lang) {
  const path = getPathFromUrl(url)
  const langPrefix = `/${lang}`
  if (path.startsWith(langPrefix + '/')) {
    return path.substring(langPrefix.length) || '/'
  } else if (path === langPrefix) {
    return '/'
  }
  return path
}

// Get the domain from API response or license
const licenseDomain = computed(() => {
  return domain.value || props.license?.domain_name || 'example.com'
})

// Generate the default translated slug for a language
function getDefaultSlug(url, lang) {
  const path = getPathFromUrl(url)
  return `/${lang}${path}`
}

// Get the full URL for display
function getFullUrl(path, lang = null) {
  const domain = licenseDomain.value
  const cleanPath = path?.startsWith('/') ? path : `/${path || ''}`
  if (lang) {
    return `https://${domain}/${lang}${cleanPath}`
  }
  return `https://${domain}${cleanPath}`
}

function getLocalTranslations(page) {
  if (!localTranslations[page.hash]) {
    // Initialize with existing translations or default values
    const translations = { ...(page.url_translations || {}) }
    // Set default values for any language that doesn't have a translation
    languages.value.forEach(lang => {
      const langCode = typeof lang === 'object' ? lang.code : lang
      if (!translations[langCode]) {
        translations[langCode] = getDefaultSlug(page.url, langCode)
      }
    })
    localTranslations[page.hash] = translations
  }
  return localTranslations[page.hash]
}

function markTranslationDirty(page, lang) {
  dirtyPages[page.hash] = true
}

function updateTranslationPath(page, lang, newPath) {
  // Ensure path starts with /
  const cleanPath = newPath.startsWith('/') ? newPath : `/${newPath}`
  // Store just the path (will be prefixed with /{lang} when saved)
  getLocalTranslations(page)[lang] = `/${lang}${cleanPath}`
  markTranslationDirty(page, lang)
}

function toggleExpanded(hash) {
  expandedPages[hash] = !expandedPages[hash]
}

async function toggleExcluded(page) {
  const newExcludedState = !page.excluded
  togglingExcluded[page.hash] = true

  try {
    await api.put(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings/${page.hash}`,
      {
        excluded: newExcludedState,
      },
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      }
    )

    // Update local state
    page.excluded = newExcludedState

    // Collapse the expanded section if excluding
    if (newExcludedState && expandedPages[page.hash]) {
      expandedPages[page.hash] = false
    }

    showSuccess(newExcludedState ? "Page excluded from sitemap" : "Page included in sitemap")

    // Refresh regeneration status
    await fetchRegenerationStatus()
  } catch (error) {
    console.error("Failed to toggle page exclusion:", error)
    showError(error.response?.data?.error || "Failed to update page")
  } finally {
    togglingExcluded[page.hash] = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

function formatDateTime(dateStr) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function showSuccess(message) {
  successMessage.value = message
  showSuccessNotification.value = true
  setTimeout(() => {
    showSuccessNotification.value = false
  }, 3000)
}

function showError(message) {
  errorMessage.value = message
  showErrorNotification.value = true
  setTimeout(() => {
    showErrorNotification.value = false
  }, 5000)
}

// API Methods
async function fetchManifest() {
  if (!licenseId.value) {
    console.error('No license ID available')
    return
  }

  loading.value = true
  try {
    const response = await api.get(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings`,
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
        params: {
          per_page: 1000, // Get all pages for local filtering
        },
      }
    )

    pages.value = response.data.pages || []
    metadata.value = response.data.metadata || {}
    sitemaps.value = response.data.sitemaps || {}
    regenerationStatus.value = response.data.regeneration_status || null
    useTranslatedUrls.value = response.data.use_translated_urls || false
    domain.value = response.data.domain || props.license?.domain_name || ''

    // Extract languages from metadata or license (filter out internal keys like _xml)
    const rawLanguages = metadata.value.languages || props.license?.settings?.languages || []
    languages.value = rawLanguages.filter(lang => {
      const code = typeof lang === 'object' ? lang.code : lang
      return code && !code.startsWith('_')
    })
    sourceLanguage.value = props.license?.settings?.source_language || 'en'

    // Initialize local translations with existing values or defaults
    pages.value.forEach((page) => {
      const translations = { ...(page.url_translations || {}) }
      languages.value.forEach(lang => {
        const langCode = typeof lang === 'object' ? lang.code : lang
        if (!translations[langCode]) {
          translations[langCode] = getDefaultSlug(page.url, langCode)
        }
      })
      localTranslations[page.hash] = translations
    })

    // Initialize selected language for HTML source
    if (languages.value.length > 0 && !selectedSourceLang.value) {
      selectedSourceLang.value = getLangCode(languages.value[0])
    }

    // Fetch initial source content
    await fetchSourceContent()
  } catch (error) {
    console.error("Failed to fetch sitemap data:", error)
    showError("Failed to load sitemap data")
  } finally {
    loading.value = false
  }
}

async function savePage(page) {
  savingPages[page.hash] = true
  try {
    await api.put(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings/${page.hash}`,
      {
        title: page.title,
        excluded: page.excluded,
        url_translations: localTranslations[page.hash] || {},
      },
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      }
    )

    // Update page translations
    page.url_translations = { ...(localTranslations[page.hash] || {}) }
    dirtyPages[page.hash] = false

    showSuccess("Page saved successfully")

    // Refresh regeneration status
    await fetchRegenerationStatus()
  } catch (error) {
    console.error("Failed to save page:", error)
    showError(error.response?.data?.error || "Failed to save page")
  } finally {
    savingPages[page.hash] = false
  }
}

async function handleAddPage() {
  if (!newPageForm.value.url) {
    showError("URL is required")
    return
  }

  addingPage.value = true
  try {
    await api.post(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings`,
      {
        url: newPageForm.value.url,
        title: newPageForm.value.title,
        changefreq: newPageForm.value.changefreq,
        priority: newPageForm.value.priority,
      },
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      }
    )

    showSuccess("Page added successfully")
    newPageForm.value = {
      url: "",
      title: "",
      changefreq: "weekly",
      priority: 0.5,
    }
    showAddForm.value = false
    await fetchManifest()
  } catch (error) {
    console.error("Failed to add page:", error)
    showError(error.response?.data?.error || "Failed to add page")
  } finally {
    addingPage.value = false
  }
}

async function handleDeletePage(page) {
  if (!confirm(`Are you sure you want to delete "${page.url}"?`)) {
    return
  }

  try {
    await api.delete(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings/${page.hash}`,
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      }
    )

    showSuccess("Page deleted successfully")
    await fetchManifest()
  } catch (error) {
    console.error("Failed to delete page:", error)
    showError(error.response?.data?.error || "Failed to delete page")
  }
}

async function generateSlug(page, lang) {
  generatingSlugs[`${page.hash}:${lang}`] = true
  try {
    const response = await api.post(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings/${page.hash}/generate-slug`,
      { language: lang },
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      }
    )

    if (response.data.success) {
      localTranslations[page.hash][lang] = response.data.generated_slug
      // Also update the page's url_translations for preview
      if (!page.url_translations) {
        page.url_translations = {}
      }
      page.url_translations[lang] = response.data.generated_slug
      dirtyPages[page.hash] = true
      showSuccess(`Generated slug for ${lang.toUpperCase()}`)
    }
  } catch (error) {
    console.error("Failed to generate slug:", error)
    showError(error.response?.data?.error || "Failed to generate slug")
  } finally {
    generatingSlugs[`${page.hash}:${lang}`] = false
  }
}

async function generateAllSlugs(page) {
  generatingAll[page.hash] = true
  try {
    const response = await api.post(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings/${page.hash}/generate-all-slugs`,
      {},
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      }
    )

    if (response.data.success) {
      Object.entries(response.data.generated_slugs).forEach(([lang, slug]) => {
        localTranslations[page.hash][lang] = slug
        // Also update the page's url_translations for preview
        if (!page.url_translations) {
          page.url_translations = {}
        }
        page.url_translations[lang] = slug
      })
      dirtyPages[page.hash] = true
      showSuccess("Generated all URL slugs")
    }
  } catch (error) {
    console.error("Failed to generate slugs:", error)
    showError(error.response?.data?.error || "Failed to generate slugs")
  } finally {
    generatingAll[page.hash] = false
  }
}

async function updateTranslatedUrlsSetting() {
  updatingSettings.value = true
  try {
    await api.put(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings/settings`,
      { use_translated_urls: useTranslatedUrls.value },
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      }
    )
    showSuccess(
      useTranslatedUrls.value
        ? "Translated URLs enabled"
        : "Translated URLs disabled"
    )
  } catch (error) {
    console.error("Failed to update settings:", error)
    useTranslatedUrls.value = !useTranslatedUrls.value // Revert
    showError(error.response?.data?.error || "Failed to update settings")
  } finally {
    updatingSettings.value = false
  }
}

async function fetchRegenerationStatus() {
  try {
    const response = await api.get(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings/regeneration-status`,
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      }
    )
    regenerationStatus.value = response.data
  } catch (error) {
    console.error("Failed to fetch regeneration status:", error)
  }
}

async function triggerRegeneration() {
  regenerating.value = true
  try {
    const response = await api.post(
      `${config.appApiUrl}licenses/${licenseId.value}/url-mappings/regenerate`,
      {},
      {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      }
    )
    if (response.data.success) {
      showSuccess(response.data.message)
      await fetchRegenerationStatus()
      // Refetch manifest to get updated sitemap URLs, then fetch source
      await fetchManifest()
    } else {
      showError(response.data.message || "Failed to trigger regeneration")
    }
  } catch (error) {
    console.error("Failed to trigger regeneration:", error)
    showError(error.response?.data?.message || "Failed to trigger regeneration")
  } finally {
    regenerating.value = false
  }
}

// Helper to get language code from language object or string
function getLangCode(lang) {
  return typeof lang === 'object' ? lang.code : lang
}

// Format selection handler
function selectFormat(newFormat) {
  format.value = newFormat
  fetchSourceContent()
}

// Fetch source content from S3
async function fetchSourceContent() {
  sourceLoading.value = true
  sourceError.value = ""
  sourceContent.value = ""

  try {
    let url = null

    if (format.value === "xml") {
      // Fetch XML sitemap
      url = sitemaps.value._xml?.url
    } else {
      // Fetch HTML sitemap for selected language
      const lang = selectedSourceLang.value || (languages.value.length > 0 ? getLangCode(languages.value[0]) : null)
      if (lang && sitemaps.value[lang]?.html?.url) {
        url = sitemaps.value[lang].html.url
      }
    }

    if (!url) {
      sourceError.value = "Sitemap file not found. Try regenerating the sitemaps."
      return
    }

    // Fetch the content directly from S3 URL
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }
    sourceContent.value = await response.text()
  } catch (error) {
    console.error("Failed to fetch source content:", error)
    sourceError.value = error.message || "Failed to load source content"
  } finally {
    sourceLoading.value = false
  }
}

// Helper to build full URL with domain
function buildFullUrl(path) {
  const domain = licenseDomain.value
  const cleanPath = getPathFromUrl(path)
  return `https://${domain}${cleanPath}`
}

// Calculate priority based on URL depth
function calculatePriority(url) {
  const path = getPathFromUrl(url)
  const segments = path.split('/').filter(s => s.length > 0)
  const depth = segments.length

  if (depth === 0) return '1.0'  // Homepage
  if (depth === 1) return '0.8'  // Top-level pages
  if (depth === 2) return '0.6'  // Second-level pages
  return '0.5'                    // Deeper pages
}
async function handleCopy() {
  if (!sourceContent.value) return
  await navigator.clipboard.writeText(sourceContent.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function handleDownload() {
  if (!sourceContent.value) return
  const content = sourceContent.value
  const mimeType = format.value === 'xml' ? 'application/xml' : 'text/html'
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = sourceFilename.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  downloaded.value = true
  setTimeout(() => {
    downloaded.value = false
  }, 2000)
}

// Initialize
onMounted(() => {
  fetchManifest()

  // Poll regeneration status every 10 seconds if regenerating
  const statusInterval = setInterval(() => {
    if (regenerationStatus.value?.status === 'regenerating' ||
        regenerationStatus.value?.status === 'pending') {
      fetchRegenerationStatus()
    }
  }, 10000)

  // Cleanup on unmount
  return () => clearInterval(statusInterval)
})
</script>

<style scoped>
.sitemap-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.sitemap-page.is-loading {
  opacity: 0.7;
}

/* Header */
.sitemap-header {
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 1rem 0;
}

.sitemap-description {
  margin: 0;
  color: var(--text-secondary, #6b7280);
  font-size: 0.8rem;
  max-width: 600px;
  text-align: left;
}

.icon-success {
  color: #16a34a;
}

/* Button icons - proper sizing and alignment */
.btn .btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
}

.btn .btn-icon :deep(svg) {
  width: 16px;
  height: 16px;
  display: block;
  transform: translateY(0.5px);
}

/* Regeneration Banner */
/* Sitemap Status Bar */
.sitemap-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.last-built {
  font-size: 13px;
  color: #6b7280;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
}

.status-badge.regenerating {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.pending {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge .status-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
}

.status-message {
  font-size: 14px;
  color: #374151;
}

.countdown {
  font-size: 12px;
  color: #6b7280;
}

/* Settings Bar */
.settings-bar {
  border-bottom: 1px solid #e5e7eb;
  padding: 0 0 12px 0;
  margin-bottom: 16px;
}

.setting-toggle {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.toggle-text {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  white-space: nowrap;
}

.settings-help {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

.settings-help code {
  background: #e5e7eb;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.switch input:checked + .slider {
  background-color: #2563eb;
}

.switch input:checked + .slider:before {
  transform: translateX(20px);
}

.switch input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

@media (max-width: 1200px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

/* Card */
.overview-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.card-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.header-with-subtitle {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.domain-subtitle {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
}

.format-header {
  border-top: 1px solid #e5e7eb;
}

.card-body {
  padding: 8px 12px 12px 12px;
}

.card-footer {
  border-top: 1px solid #e5e7eb;
  padding: 12px;
}

.scrollable {
  max-height: 600px;
  overflow-y: auto;
}

/* Filter Bar */
.filter-bar {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.sitemap-filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.filter-buttons {
  display: flex;
  gap: 4px;
}

/* Search */
.search-and-stats {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filter-stats {
  font-size: 13px;
  color: #6b7280;
}

/* Forms */
.add-form {
  margin-bottom: 16px;
  padding: 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.add-form h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.range-input {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  -webkit-appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #2563eb;
  border-radius: 50%;
  cursor: pointer;
}

.button-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  line-height: 1;
  gap: 6px;
}

.btn > span {
  display: inline-flex;
  align-items: center;
}

.btn-small {
  padding: 0 12px;
  font-size: 13px;
  height: 30px;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  color: #374151;
  border-color: #d1d5db;
}

.btn-outline:hover {
  background: #f3f4f6;
}

.btn-outline.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

/* Icon Buttons */
.icon-btn {
  padding: 2px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.icon-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-btn-danger {
  color: #dc2626;
}

.icon-btn-danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.icon-btn-save {
  color: #16a34a;
}

.icon-btn-save:hover {
  background: #f0fdf4;
}

.icon-btn-disabled {
  color: #d1d5db;
  cursor: not-allowed;
}

.icon-btn-disabled:hover {
  background: transparent;
  color: #d1d5db;
}

.icon-btn-excluded {
  color: #f59e0b;
}

.icon-btn-excluded:hover {
  background: #fef3c7;
  color: #d97706;
}

/* Page List */
.page-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 5px;
  transition: all 0.2s;
}

.page-item:hover {
  border-color: #93c5fd;
}

.page-item.is-excluded {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.page-item.is-excluded .page-url,
.page-item.is-excluded .page-title,
.page-item.is-excluded .page-meta {
  opacity: 0.5;
}

.page-item.is-excluded .url-text {
  text-decoration: line-through;
  color: #9ca3af;
}

.page-item.is-dirty {
  border-color: #fbbf24;
  background: #fffbeb;
}

.page-item.is-saving {
  opacity: 0.7;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
  margin: 0;
  margin-bottom: 0;
}

.page-url {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.url-text {
  font-family: monospace;
  font-size: 13px;
  color: #2563eb;
  word-break: break-all;
  margin: 0;
  padding: 0;
  line-height: 1.3;
}

.source-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.source-badge.manual {
  background: #fef3c7;
  color: #92400e;
}

.page-title {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 2px 0;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.page-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  padding: 2px 6px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 3px;
  font-size: 10px;
}

.badge-primary {
  background: #dbeafe;
  color: #1e40af;
}

/* Expanded Translations */
.translations-expanded {
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.translations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.translations-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.translation-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.translation-row:last-child {
  margin-bottom: 0;
}

.lang-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  width: 40px;
  flex-shrink: 0;
}

.translation-input {
  flex: 1;
}

/* URL Input with Domain Prefix */
.url-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  overflow: hidden;
}

.domain-prefix {
  padding: 8px 4px 8px 12px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 13px;
  font-family: monospace;
  white-space: nowrap;
  border-right: 1px solid #e5e7eb;
}

.path-input {
  border: none !important;
  border-radius: 0 !important;
  flex: 1;
  min-width: 100px;
  font-family: monospace;
}

.path-input:focus {
  box-shadow: none !important;
  outline: none !important;
}

.url-input-wrapper:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Info Badge */
.info-badge {
  padding: 4px 8px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.sitemap-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Language selector for HTML source */
.lang-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: white;
  cursor: pointer;
}

.lang-select:focus {
  outline: none;
  border-color: #2563eb;
}

/* Language Tabs */
.language-tabs {
  display: flex;
  gap: 4px;
}

.lang-tab {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-tab:hover {
  background: #f3f4f6;
}

.lang-tab.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

/* Format Buttons */
.format-buttons {
  display: flex;
  gap: 8px;
}

/* Preview */
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.line-count {
  padding: 4px 12px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 16px;
  font-size: 12px;
}

.code-preview {
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  background: #374151;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #4b5563;
}

.filename {
  color: #d1d5db;
  font-size: 13px;
  font-family: monospace;
}

.window-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-red { background: #ef4444; }
.dot-yellow { background: #eab308; }
.dot-green { background: #22c55e; }

.code-content {
  padding: 16px;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 400px;
  margin: 0;
  text-align: left;
}

.code-content :deep(code) {
  color: #f3f4f6;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
  display: block;
  text-align: left;
}

.code-content :deep(.hljs-meta) {
  display: inline;
  text-align: left;
}

/* Loading and Error states in code preview */
.code-loading,
.code-error {
  padding: 48px 24px;
  text-align: center;
  color: #9ca3af;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.code-error {
  color: #f87171;
}

/* Sitemap Files */
.sitemap-files {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.sitemap-files h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.sitemap-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sitemap-lang-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sitemap-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 13px;
}

.sitemap-link:hover {
  text-decoration: underline;
}

/* Pagination */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pagination-info {
  font-size: 14px;
  color: #374151;
  padding: 0 12px;
}

/* Loading/Empty States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

.mini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Transitions */
.page-row-enter-active,
.page-row-leave-active {
  transition: all 0.3s ease;
}

.page-row-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.page-row-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Scrollbar */
.scrollable::-webkit-scrollbar,
.code-content::-webkit-scrollbar {
  width: 8px;
}

.scrollable::-webkit-scrollbar-track,
.code-content::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.scrollable::-webkit-scrollbar-thumb,
.code-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.scrollable::-webkit-scrollbar-thumb:hover,
.code-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
