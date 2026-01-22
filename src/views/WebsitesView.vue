<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { useAuthStore } from "../stores/auth"
import { useLicenseStore } from "../stores/license"
import { useThemeStore } from "../stores/theme"
import SlideInNotification from "../components/SlideInNotification.vue"
import { useRouter } from "vue-router"

const authStore = useAuthStore()
const licenseStore = useLicenseStore()
const themeStore = useThemeStore()
const websites = ref([])
const error = ref(null)
const selectedLicense = ref(null)
const savedStates = ref({})
const failMessage = ref("")
const successMessage = ref("")
const showSuccessNotification = ref(false)
const isSaving = ref(false)

const router = useRouter()

const accountRole = computed(() => {
  return authStore.currentAccountRole
})

const isEmbedded = computed(() => {
  return themeStore.isEmbedded
})

const loading = computed(() => licenseStore.state.loading.licenses)

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

const pushToManageLicense = (licenseId) => {
  router.push({ name: "manage-license", params: { id: licenseId } })
}

// Fetch and map websites
const fetchWebsites = () => {
  licenseStore.getLicenses().then(() => {
    if (licenseStore.state.licenses && licenseStore.state.licenses.length > 0) {
      websites.value = licenseStore.state.licenses.map((license) => {
        const settings = license.settings || {}
        // Ensure TTS settings have defaults within the settings object
        if (settings.enabled === undefined) {
          settings.enabled = true
        }
        if (settings.ttsEnabled === undefined) {
          settings.ttsEnabled = false
        }
        if (settings.ttsHighlighting === undefined) {
          settings.ttsHighlighting = true
        }

        return {
          id: license.id,
          name: license.domain_name.replace(/^(https?:\/\/)/, ""),
          status: (() => {
            if (license.status === "active") {
              return settings.enabled ? "Active" : "Disabled"
            } else {
              return "Inactive"
            }
          })(),
          product: license.product,
          type: license.type,
          languages: settings.languages || [{ code: "en", name: "English" }],
          lastSync: formatDate(license.updated_at),
          license_key: license.license_key,
          settings: settings,
          createdAt: license.created_at,
          isSaving: false,
        }
      })
    }
  })
}
// Watch for account changes and refetch data
watch(
  () => authStore.currentAccountId,
  (newAccountId, oldAccountId) => {
    if (newAccountId && newAccountId !== oldAccountId) {
      console.log(
        `Account switched from ${oldAccountId} to ${newAccountId}, refetching websites`
      )
      fetchWebsites()
    }
  },
  { immediate: false }
)

const pushToCheckoutPage = () => {
  router.push({ path: "/checkout" })
}

// Load data on component mount
onMounted(() => {
  // Check if auth store is ready, if not wait a bit
  if (authStore.currentAccountId) {
    fetchWebsites()
  } else {
    // Wait for auth store to initialize
    const checkAuth = setInterval(() => {
      if (authStore.currentAccountId) {
        clearInterval(checkAuth)
        fetchWebsites()
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

<template>
  <div class="websites-container max-1200 padding">
    <div class="page-header">
      <h2 class="page-title">Websites</h2>
      <button
        v-if="!isEmbedded"
        class="btn btn-primary create-license-btn"
        @click="pushToCheckoutPage"
      >
        + Add Website
      </button>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isSaving" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Saving...</p>
    </div>

    <!-- Success Notification -->
    <SlideInNotification
      :show="showSuccessNotification"
      :message="successMessage"
      type="success"
    />
    <!-- Failure Notification -->
    <SlideInNotification
      :show="!!failMessage"
      :message="failMessage"
      type="fail"
    />

    <!-- Loading State -->
    <div v-if="loading && websites.length === 0" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading websites...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <h3>Error Loading Websites</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="fetchWebsites">
          Try Again
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="websites.length === 0" class="empty-container">
      <div class="empty-message">
        <h3>No Websites Found</h3>
        <p>You haven't added any websites yet.</p>
        <button class="btn btn-primary" @click="pushToCheckoutPage">
          Add Your First Website
        </button>
      </div>
    </div>

    <!-- Websites Grid -->
    <div v-else class="websites-grid">
      <div
        v-for="website in websites"
        :key="website.id"
        class="website-card"
        :class="{ 'saved-flash': savedStates[website.id] }"
        @click="pushToManageLicense(website.id)"
      >
        <div class="website-header">
          <h3 class="website-name">{{ website.name }}</h3>
          <div class="website-badges">
            <span v-if="website.type === 'free'" class="website-badge free-tier">
              Free Plan
            </span>
            <span class="website-status" :class="website.status.toLowerCase()">{{
              website.status
            }}</span>
          </div>
        </div>
        <div class="website-meta">
          <div class="meta-item">
            <span class="meta-label">Languages:</span>
            <span class="meta-value">{{
              website.languages.map((l) => l.name).join(", ")
            }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Last Updated:</span>
            <span class="meta-value">{{ website.lastSync }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">License Key:</span>
            <span class="meta-value license-key"
              >{{ website.license_key.substring(0, 8) }}...</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.websites-container {
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.account-context {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
  background: rgba(102, 126, 234, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  align-self: flex-start;
}

.websites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.website-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.website-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.website-card.saved-flash {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.3);
  animation: savedPulse 2s ease-out;
}

@keyframes savedPulse {
  0% {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.5);
    transform: scale(1.02);
  }
  50% {
    background: rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.4);
  }
  100% {
    background: var(--bg-secondary);
    border: 1px solid transparent;
    transform: scale(1);
  }
}

.website-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1rem;
}

.website-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 1rem 0 0;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.website-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.website-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.website-badge.free-tier {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
  color: #667eea;
}

.website-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.website-status.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.website-status.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.website-status.disabled {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.website-status.pending {
  background: rgba(251, 146, 60, 0.1);
  color: #fb9235;
}

.website-meta {
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.meta-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.meta-value {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.website-actions {
  /* display: flex;
  gap: 0.5rem; */
  /* align-items: flex-start; */
  margin-left: 1rem;
}

.license-key {
  font-family: monospace;
  font-size: 0.8rem;
}

/* Error State */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
}

.error-message {
  text-align: center;
  max-width: 400px;
}

.error-message h3 {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.error-message p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Empty State */
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
}

.empty-message {
  text-align: center;
  max-width: 400px;
}

.empty-message h3 {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-message p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  flex: 1;
}

.create-license-btn {
  flex: none;
  white-space: nowrap;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-secondary {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-outline {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn:hover {
  transform: translateY(-1px);
}
</style>
