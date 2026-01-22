<template>
  <div class="manage-license-container max-1200 padding">
    <!-- Loading State -->
    <div v-if="loading && !license" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading license details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <h3>Error Loading License</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="fetchLicense">Try Again</button>
      </div>
    </div>

    <!-- License Not Found -->
    <div v-else-if="!license && !loading" class="not-found-container">
      <div class="not-found-message">
        <h3>License Not Found</h3>
        <p>
          The requested license could not be found or you don't have access to
          it.
        </p>
        <router-link to="/websites" class="btn btn-primary"
          >Back to Websites</router-link
        >
      </div>
    </div>

    <!-- License Details -->
    <div v-else class="license-content">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div v-if="!isEmbedded" class="breadcrumb">
            <router-link to="/websites" class="breadcrumb-link"
              >Websites</router-link
            >
            <span class="breadcrumb-separator">/</span>
            <router-link
              :to="`/websites/${licenseId}`"
              class="breadcrumb-link"
              >{{ license.name }}</router-link
            >
          </div>
          <div class="title-section">
            <h1 class="page-title">{{ license.name }}</h1>
            <div class="license-meta">
              <span
                v-if="isFree"
                class="status-badge free-tier"
                >Free Plan</span
              >
              <span
                class="status-badge"
                :class="license.status.toLowerCase()"
                >{{ license.status }}</span
              >
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button
            v-if="!isEmbedded"
            class="btn btn-primary"
            :class="{ 'btn-success': copiedHeaderScript }"
            @click="copyHeaderInstallationScript"
          >
            <svg
              class="btn-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
            {{ copiedHeaderScript ? "Copied!" : "Copy Installation Script" }}
          </button>
          <a
            href="https://weblinguist.ai/wp-content/uploads/2025/12/Web-Linguist-Quick-Start-Guide-v1.pdf"
            target="_blank"
            class="btn btn-outline"
          >
            Quick Start Guide
          </a>
        </div>
      </div>

      <!-- Main Tabs -->
      <div class="main-tabs-nav">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'general' }"
          @click="navigateToGeneralTab"
        >
          General
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'customize' }"
          @click="navigateToCustomizeTab"
        >
          Customize
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'translation_management' }"
          @click="navigateToGlossaryTab"
        >
          Glossary
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'sitemap' }"
          @click="navigateToSitemapTab"
        >
          Sitemap
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'localization' }"
          @click="navigateToLocalizationTab"
        >
          Localization
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'analytics' }"
          @click="navigateToAnalyticsTab"
        >
          Analytics
        </button>
      </div>

      <!-- General Tab Content -->
      <div v-if="activeTab === 'general'" class="main-tab-pane">
        <!-- Free Tier Upgrade Banner -->
        <div v-if="isFree" class="free-tier-banner">
          <div class="banner-content">
            <div class="banner-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div class="banner-text">
              <h4>You're on the Free Plan</h4>
              <p>Upgrade to unlock more languages, glossary management, and more premium features.</p>
            </div>
            <button @click="goToCheckoutUpgrade(license.id)" class="btn btn-primary banner-btn">Upgrade Now</button>
          </div>
        </div>

        <!-- Scheduled Change Alert (pending cancellation/downgrade) -->
        <ScheduledChangeAlert
          v-if="scheduledChange"
          :scheduled-change="scheduledChange"
          :license-id="license.id"
          @change-cancelled="handleScheduledChangeCancelled"
        />

        <!-- License Overview Cards -->
        <div class="overview-section">
          <!-- Loading Overlay for updates -->
          <div v-if="isSaving" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>Saving...</p>
          </div>

          <!-- notifications -->
          <SlideInNotification
            :show="showSuccessNotification"
            :message="successMessage"
            type="success"
          />
          <SlideInNotification
            :show="showFailNotification"
            :message="failMessage"
            type="fail"
          />

          <div class="overview-grid">
            <!-- Domain card -->
            <div v-show="!isEmbedded" class="overview-card">
              <div class="card-header">
                <h3 class="card-title">Domain</h3>
                <button
                  class="btn btn-small"
                  @click="updateDomain(license.name)"
                >
                  <span v-if="isSaving"> Saving... </span>
                  <span v-else>Update Domain</span>
                </button>
              </div>
              <div class="card-content">
                <div class="domain-info">
                  <div class="domain-item">
                    <DomainSelect v-model="license.name" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Installation Card Component -->
            <Installation 
              :license="license"
              :is_free="isFree"
            />

            <!-- Languages Card -->
            <div class="overview-card">
              <div class="card-header">
                <h3 class="card-title">Languages</h3>
                <button
                  class="btn btn-small"
                  @click="openLanguageSettingsModal"
                >
                  Edit
                </button>
              </div>
              <div class="card-content">
                <div class="language-tags">
                  <span
                    v-for="lang in license.languages"
                    :key="lang.code"
                    class="language-tag"
                  >
                    {{ lang.name }}
                  </span>
                </div>
                <div class="language-count">
                  {{ license.languages.length }} / {{ languageLimit }} languages
                  selected
                </div>
              </div>
            </div>

            <!-- Status Card -->
            <div class="overview-card">
              <div class="card-header">
                <h3 class="card-title">License Status</h3>
                <span
                  class="status-badge"
                  :class="license.status.toLowerCase()"
                  >{{ license.status }}</span
                >
              </div>
              <div class="card-content">
                <div class="status-info">
                  <div class="status-item">
                    <span class="status-label">Enable:</span>
                    <label class="toggle-label" @click.stop>
                      <input
                        type="checkbox"
                        class="toggle-checkbox"
                        :checked="license.settings.enabled"
                        @change="toggleEnabled"
                        :disabled="isSaving"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                  <div class="status-item">
                    <span class="status-label">Created:</span>
                    <span class="status-value">{{
                      formatDate(license.createdAt)
                    }}</span>
                  </div>
                  <div class="status-item">
                    <span class="status-label">Last Updated:</span>
                    <span class="status-value">{{ license.lastSync }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- License Key Card -->
            <div class="overview-card">
              <div class="card-header">
                <h3 class="card-title">License Key</h3>
                <button
                  class="btn btn-small"
                  :class="{ 'btn-success': copiedKey }"
                  @click="copyLicenseKey"
                >
                  {{ copiedKey ? "Copied!" : "Copy" }}
                </button>
              </div>
              <div class="card-content">
                <code class="license-key-display">{{
                  license.license_key
                }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- customize tab content -->
      <div v-if="activeTab === 'customize'" class="main-tab-pane">
        <Customize :license="license" :is-free="isFree" @setting-saved="handleSettingSaved" />
      </div>

      <!-- Translation Management Tab Content -->
      <div v-if="activeTab === 'translation_management'" class="main-tab-pane">
        <UpgradePrompt
          v-if="isFree"
          title="Translation Glossary"
          description="Upgrade to control how specific terms are translated across your website with custom glossary rules."
          :features="[
            'Exclude brand names from translation',
            'Define custom term replacements',
            'Language-specific translation rules',
            'Global rules for all languages'
          ]"
          :upgrade-route="{ name: 'checkout', params: { type: 'upgrade-free', id: license.id } }"
        />
        <!-- Translations Management Card -->
        <div v-else class="overview-card translations-management-card">

          <div class="card-content">
            <div class="tabs-container">
              <div class="tab-content">
                <div
                  v-if="activeTranslationsTab === 'glossary'"
                  class="tab-pane"
                >
                  <GlossaryManager :license_id="licenseId" :license="license" />
                </div>
                <div
                  v-if="activeTranslationsTab === 'per_page_customization'"
                  class="tab-pane"
                >
                  <FeaturePlaceholder
                    title="Per-Page Translation Customization"
                    description="Customize translation behavior for specific pages on your website. Control which elements get translated, set page-specific glossary rules, and fine-tune the language experience for different sections of your site."
                    :features="[
                      'Page-specific overrides',
                      'Element inclusion/exclusion rules per page',
                      'Visual translation editor lets you edit translations directly on your website',
                      'Custom translation priorities',
                    ]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sitemap Tab -->
       <div v-if="activeTab === 'sitemap'" class="main-tab-pane">
        <UpgradePrompt
          v-if="isFree"
          title="Multilingual Sitemap"
          description="Upgrade to generate SEO-optimized sitemaps with hreflang annotations for all your translated pages."
          :features="[
            'Auto-generated multilingual sitemaps',
            'Proper hreflang annotations',
            'XML and HTML sitemap formats',
            'Improved search engine indexing'
          ]"
          :upgrade-route="{ name: 'checkout', params: { type: 'upgrade-free', id: license.id } }"
        />
        <Sitemap v-else :license="license" />
       </div>

       <!-- Localizations Tab -->
       <div v-if="activeTab === 'localization'" class="main-tab-pane">
        <Localization 
        :license="license"
        />
       </div>

       <!-- Analytics Tab -->
       <div v-if="activeTab === 'analytics'" class="main-tab-pane">
        <Analytics :license="license" />
       </div>
    </div>

    <!-- Language Settings Modal -->
    <LanguageSettingsModal
      :show="showLanguageSettingsModal"
      :license="license"
      @close="closeLanguageSettingsModal"
      @save="handleLanguagesSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "../stores/auth"
import { useThemeStore } from "../stores/theme"
import { useLicenseStore } from "../stores/license"
import LanguageSettingsModal from "../components/LanguageSettingsModal.vue"
import DomainSelect from "../components/DomainSelect.vue"
import api from "../utils/api"
import { config } from "../config/environment"
import GlossaryManager from "../components/GlossaryManager.vue"
import SlideInNotification from "../components/SlideInNotification.vue"
import Customize from "../components/License/Customize.vue"
import FeaturePlaceholder from "../components/FeaturePlaceholder.vue"
import Analytics from "../components/License/Analytics.vue"
import Sitemap from "../components/License/Sitemap.vue"
import Localization from "../components/License/Localization.vue"
import Installation from "../components/License/Installation.vue"
import UpgradePrompt from "../components/UpgradePrompt.vue"
import ScheduledChangeAlert from "../components/ScheduledChangeAlert.vue"

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const licenseStore = useLicenseStore()
const themeStore = useThemeStore()

const license = ref(null)
const loading = ref(false)
const error = ref(null)
const showSettingsModal = ref(false)
const showLanguageSettingsModal = ref(false)
const copiedKey = ref(false) 
const copiedHeaderScript = ref(false)
const activeTranslationsTab = ref("glossary")
const activeTab = ref("general")
const successMessage = ref("")
const failMessage = ref("")
const showSuccessNotification = ref(false)
const showFailNotification = ref(false)

const isEmbedded = computed(() => themeStore.isEmbedded)

const isSaving = computed(() => licenseStore.state.loading.licenses)

// Get license ID from route params
const licenseId = computed(() => route.params.id)

// Check if license is free tier
const isFree = computed(() => license.value?.type === 'free')

// Get scheduled change info if any
const scheduledChange = computed(() => license.value?.scheduled_change || null)

// Handler for when scheduled change is cancelled
function handleScheduledChangeCancelled() {
  // Refresh the license data
  fetchLicense()
  showSuccessNotification.value = true
  successMessage.value = 'Your subscription has been resumed successfully.'
}

const accountRole = computed(() => authStore.currentAccountRole)

// Tab navigation methods
const navigateToGeneralTab = () => {
  router.push({ name: "manage-license", params: { id: licenseId.value } })
}

const navigateToCustomizeTab = () => {
  router.push({
    name: "manage-license-customize",
    params: { id: licenseId.value },
  })
}

const navigateToGlossaryTab = () => {
  router.push({
    name: "manage-license-translations",
    params: { id: licenseId.value },
  })
}

const navigateToPerPageTab = () => {
  router.push({
    name: "manage-license-translations-perpage",
    params: { id: licenseId.value },
  })
}

const navigateToLocalizationTab = () => {
  router.push({
    name: "manage-license-localization",
    params: { id: licenseId.value },
  })
}

const navigateToSitemapTab = () => {
  router.push({
    name: "manage-license-sitemap",
    params: { id: licenseId.value },
  })
}

const navigateToAnalyticsTab = () => {
  router.push({
    name: "manage-license-analytics",
    params: { id: licenseId.value },
  })
}

const goToCheckoutUpgrade = (licenseId) => {
  router.push({
    name: 'checkout',
    params: { type: 'upgrade-free', id: licenseId }
  })
}


// Initialize tabs from route and watch for changes
const syncTabsWithRoute = () => {
  const routeName = route.name

  if (routeName === "manage-license") {
    activeTab.value = "general"
    activeTranslationsTab.value = "glossary"
  } else if (routeName === "manage-license-customize") {
    activeTab.value = "customize"
  } else if (routeName === "manage-license-translations") {
    activeTab.value = "translation_management"
    activeTranslationsTab.value = "glossary"
  } else if (routeName === "manage-license-sitemap") {
    activeTab.value = "sitemap"
  } else if (routeName === "manage-license-localization") {
    activeTab.value = "localization"
  } else if (routeName === "manage-license-analytics") {
    activeTab.value = "analytics"
  }
}

const toggleEnabled = () => {
  const newEnabledState = !license.value.settings.enabled

  const payload = {
    license_id: license.value.id,
    settings: { enabled: newEnabledState },
  }

  licenseStore
    .updateLicenseSettings(payload)
    .then(() => {
      // Refetch to get the most up-to-date license state, including status
      fetchLicense()
      successMessage.value = `Website ${
        newEnabledState ? "enabled" : "disabled"
      } successfully.`
      showSuccessNotification.value = true
      setTimeout(() => (showSuccessNotification.value = false), 3000)
    })
    .catch((error) => {
      failMessage.value = `Failed to update: ${
        error.message || "Unknown error"
      }`
      showFailNotification.value = true
      setTimeout(() => (showFailNotification.value = false), 3000)
    })
}
// Watch route changes
watch(
  () => route.name,
  () => {
    syncTabsWithRoute()
  }
)

// Fetch license data
const fetchLicense = async () => {
  if (!authStore.currentAccountId) {
    const msg = "No account available. Please ensure you are logged in."
    error.value = msg
    return Promise.reject(new Error(msg))
  }

  loading.value = true
  error.value = null

  try {
    const response = await api.get(`${config?.appApiUrl}licenses/${licenseId.value}`, {
      headers: {
        "X-Account-ID": authStore.currentAccountId.toString(),
      },
    })

    const result = response.data

    if (result.success) {
      // Transform license data to match website format
      const settings = result.license.settings || {}
      if (settings.enabled === undefined) {
        settings.enabled = true
      }
      // Ensure TTS settings have defaults within the settings object
      if (settings.ttsEnabled === undefined) {
        settings.ttsEnabled = false
      }
      if (settings.ttsHighlighting === undefined) {
        settings.ttsHighlighting = true
      }

      // Update store with DNS check data
      licenseStore.state.dnsCheckData = result.license?.dns_check 

      license.value = {
        id: result.license.id,
        name: result.license.domain_name,
        status: (() => {
          if (result.license.status === "active") {
            return settings.enabled ? "Active" : "Disabled"
          } else {
            return "Inactive"
          }
        })(),
        product: result.license.product,
        languages: settings.languages || [{ code: "en", name: "English" }],
        type: result.license.type,
        lastSync: formatDate(result.license.updated_at),
        license_key: result.license.license_key,
        settings: settings,
        dns_check: result.license.dns_check,
        createdAt: result.license.created_at,
        scheduled_change: result.license.scheduled_change || null,
        subscription_id: result.license.subscription_id || null,
      }
      return response // Resolve the promise with the full response
    } else {
      throw new Error(result.error || "Failed to get license")
    }
  } catch (err) {
    console.error("Error getting license:", err)
    error.value = err.message
    throw err // Re-throw the error to reject the promise
  } finally {
    loading.value = false
  }
}

const languageLimit = computed(() => {
  if (!license.value) return 0

  // Free tier gets 1 language
  if (license.value.type === "free") {
    return 1
  }

  // Manual licenses get 25 languages
  if (license.value.type === "manual") {
    return 25
  }

  // Subscription-based limits
  let limit = 0
  if (license.value.product) {
    const subType = license.value.product.toLowerCase()
    if (subType.includes("starter")) limit = 1
    if (subType.includes("growth")) limit = 3
    if (subType.includes("pro")) limit = 5
  }

  return limit
})

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

  if (diffInHours < 1) return "Less than 1 hour ago"
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInHours < 48) return "1 day ago"
  return `${Math.floor(diffInHours / 24)} days ago`
}

// Copy license key to clipboard
const copyLicenseKey = async () => {
  if (!license.value) return

  copiedKey.value = true

  try {
    await navigator.clipboard.writeText(license.value.license_key)
    console.log("License key copied to clipboard")
  } catch (err) {
    console.error("Failed to copy license key:", err)
    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = license.value.license_key
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
  }

  // Reset copied state after 2 seconds
  setTimeout(() => {
    copiedKey.value = false
  }, 2000)
}

// Generate installation script using centralized store function
const installationScript = computed(() => license.value ? licenseStore.generateInstallationScript(license.value) : '');

// Copy installation script from header button
const copyHeaderInstallationScript = async () => {
  if (!license.value) return

  const script = await installationScript.value;
  copiedHeaderScript.value = true

  try {
    await navigator.clipboard.writeText(script)
    console.log("Header installation script copied to clipboard")
  } catch (err) {
    console.error("Failed to copy header installation script:", err)
    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = script
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
  }

  // Reset copied state after 2 seconds
  setTimeout(() => {
    copiedHeaderScript.value = false
  }, 2000)
}

// Settings modal handling
const openSettingsModal = () => {
  showSettingsModal.value = true
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

// Language settings modal handling
const openLanguageSettingsModal = () => {
  showLanguageSettingsModal.value = true
}

const closeLanguageSettingsModal = () => {
  showLanguageSettingsModal.value = false
}

// Handle settings save
const handleSettingsSave = async ({
  licenseId,
  domain,
  settings,
  ttsEnabled,
  ttsHighlighting,
  polyEnabled,
  onSuccess,
  onError,
}) => {
  await licenseStore
    .updateLicenseSettings({
      license_id: licenseId,
      domain_name: domain,
      settings: settings,
      tts_enabled: ttsEnabled,
      tts_highlighting: ttsHighlighting,
      poly_enabled: polyEnabled,
    })
    .then((response) => {
      if (response.data && response.data.data && response.data.success) {
        // Assuming response.data.data contains the full updated license object
        // in the same format as result.license from fetchLicense.
        // Re-apply the transformation logic to ensure consistency.
        const updatedLicenseRaw = response.data.data
        const updatedSettings = updatedLicenseRaw.settings || {}

        // Ensure TTS settings have defaults within the settings object
        if (updatedSettings.ttsEnabled === undefined) {
          updatedSettings.ttsEnabled = false
        }
        if (updatedSettings.ttsHighlighting === undefined) {
          updatedSettings.ttsHighlighting = true
        }
        // Assuming polyEnabled is also part of settings and needs default if not present
        if (updatedSettings.polyEnabled === undefined) {
          updatedSettings.polyEnabled = false // Or whatever default is appropriate
        }

        license.value = {
          id: updatedLicenseRaw.id,
          name: updatedLicenseRaw.domain_name,
          status:
            updatedLicenseRaw.status.charAt(0).toUpperCase() +
            updatedLicenseRaw.status.slice(1),
          product: updatedLicenseRaw.product,
          languages: updatedSettings.languages || [
            { code: "en", name: "English" },
          ],
          type: updatedLicenseRaw.type,
          lastSync: formatDate(updatedLicenseRaw.updated_at),
          license_key: updatedLicenseRaw.license_key,
          settings: updatedSettings,
          createdAt: updatedLicenseRaw.created_at,
          scheduled_change: updatedLicenseRaw.scheduled_change || null,
          subscription_id: updatedLicenseRaw.subscription_id || null,
        }

        // Show success notification
        successMessage.value = "Settings saved successfully!"
        showSuccessNotification.value = true
        setTimeout(() => (showSuccessNotification.value = false), 3000)

        onSuccess("Settings saved successfully!")
      } else {
        // Show error notification
        failMessage.value = response.data.data.error
        showFailNotification.value = true

        // Hide notification after 3 seconds
        setTimeout(() => {
          showFailNotification.value = false
        }, 3000)

        // Call modal's error callback
        onError(response.data.data.error)
      }
    })
}

// Handle language save
const handleLanguagesSave = (languages) => {
  closeLanguageSettingsModal()

  licenseStore
    .updateSingleLicenseSetting({
      license_id: license.value.id,
      setting_key: "languages",
      setting_value: languages,
    })
    .then((response) => {
      if (response.data && response.data.success && response.data.data) {
        license.value.languages = languages
        license.value.settings.languages = languages

        // Show success notification
        successMessage.value = "Languages saved successfully!"
        showSuccessNotification.value = true
        setTimeout(() => (showSuccessNotification.value = false), 3000)
      }
    })
    .catch((error) => {
      // Show error notification
      failMessage.value = error.message
      showFailNotification.value = true
      setTimeout(() => (showFailNotification.value = false), 3000)
    })
}

function updateDomain(domain) {
  licenseStore
    .updateLicenseDomain({
      license_id: license.value.id,
      domain_name: domain,
    })
    .then((response) => {
      if (response.data && response.data.success && response.data.data) {
        showSuccessNotification.value = true
        successMessage.value = "Domain updated successfully!"
        setTimeout(() => (showSuccessNotification.value = false), 3000)

        license.value.domain_name = response.data.data.domain_name
      }
    })
    .catch((error) => {
      failMessage.value = error.message
      showFailNotification.value = true
      setTimeout(() => (showFailNotification.value = false), 3000)
    })
}

const handleSettingSaved = (updatedLicense) => {
  const updatedSettings = updatedLicense.settings || {}

  // Ensure TTS settings have defaults within the settings object
  if (updatedSettings.ttsEnabled === undefined) {
    updatedSettings.ttsEnabled = false
  }
  if (updatedSettings.ttsHighlighting === undefined) {
    updatedSettings.ttsHighlighting = true
  }
  if (updatedSettings.polyEnabled === undefined) {
    updatedSettings.polyEnabled = false
  }

  license.value = {
    id: updatedLicense.id,
    name: updatedLicense.domain_name,
    status:
      updatedLicense.status.charAt(0).toUpperCase() +
      updatedLicense.status.slice(1),
    product: updatedLicense.product,
    languages: updatedSettings.languages || [{ code: "en", name: "English" }],
    type: updatedLicense.type,
    lastSync: formatDate(updatedLicense.updated_at),
    license_key: updatedLicense.license_key,
    settings: updatedSettings,
    createdAt: updatedLicense.created_at,
    scheduled_change: updatedLicense.scheduled_change || null,
    subscription_id: updatedLicense.subscription_id || null,
  }
}

// Load license data on mount
onMounted(() => {
  // Initialize tabs from URL
  syncTabsWithRoute()

  // Check if auth store is ready
  if (authStore.currentAccountId) {
    fetchLicense()
  } else {
    // Wait for auth store to initialize
    const checkAuth = setInterval(() => {
      if (authStore.currentAccountId) {
        clearInterval(checkAuth)
        fetchLicense()
      }
    }, 100)

    // Clear interval after 5 seconds if still no account
    setTimeout(() => {
      clearInterval(checkAuth)
      if (!authStore.currentAccountId) {
        error.value = "No account available. Please ensure you are logged in."
      }
    }, 5000)
  }
})
</script>

<style scoped>
.manage-license-container {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading, Error, Not Found States */
.loading-container,
.error-container,
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  text-align: center;
}

.license-content {
  position: relative;
}

.error-message,
.not-found-message {
  max-width: 400px;
}

.error-message h3,
.not-found-message h3 {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.error-message p,
.not-found-message p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.license-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-badge.disabled {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-badge.free-tier {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
  color: #667eea;
  font-weight: 600;
}

/* Free Tier Upgrade Banner */
.free-tier-banner {
  margin-bottom: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.banner-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.banner-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.banner-text {
  flex: 1;
}

.banner-text h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.banner-text p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.banner-btn {
  white-space: nowrap;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  color: white;
}

.banner-btn:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    text-align: center;
  }

  .banner-text {
    text-align: center;
  }
}

.account-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.25rem;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.btn-success {
  background: #22c55e !important;
  color: white !important;
  border-color: #22c55e !important;
}

/* Overview Section */
.overview-section {
  padding: 1rem;
  margin-bottom: 3rem;
}

.domain-item {
  text-align: left;
}

.domain-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.language-count {
  font-size: 0.8rem;
  margin-top: 1rem;
  text-align: right;
  color: var(--text-secondary);
}

.card-content {
  color: var(--text-primary);
}

.license-key-display {
  font-family: monospace;
  background: var(--bg-hover);
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  word-break: break-all;
  display: block;
}

.language-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.language-tag {
  background: rgba(102, 126, 234, 0.1);
  color: var(--accent-color);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.position-info,
.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.position-item,
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.position-label,
.status-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.position-value,
.status-value {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.icon-value-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-start;
}

/* Translations Management Card */
.translations-management-card {
  /* No longer needs to span grid as it's in its own tab */
}

/* Responsive Design */
@media (max-width: 768px) {
  .manage-license-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    margin-top: 1rem;
    justify-content: flex-start;
  }

  .page-title {
    font-size: 2rem;
  }

  .translations-management-card {
    grid-column: auto; /* Reset for single column layout */
  }
}

/* Toggle Switch Styles */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.toggle-checkbox {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 48px;
  height: 24px;
  background: var(--border-color);
  border-radius: 24px;
  transition: background 0.3s ease;
}

.toggle-slider::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-checkbox:checked + .toggle-slider {
  background: #22c55e;
}

.toggle-checkbox:checked + .toggle-slider::before {
  transform: translateX(24px);
}
</style>
