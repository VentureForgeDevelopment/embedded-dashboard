<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue"
import { useAuthStore } from "../stores/auth"
import { useLicenseStore } from "../stores/license"
import { usePreCacheStore } from "../stores/precache"
import { useRouter } from "vue-router"
import api from "../utils/api"
import { config } from "../config/environment"
import Notifications from "../components/Notifications/Notifications.vue"
import PreCacheProgressBar from "../components/PreCacheProgressBar.vue"
import PreCacheToast from "../components/PreCacheToast.vue"
import Plus from "vue-material-design-icons/Plus.vue"
import Earth from "vue-material-design-icons/Earth.vue"
import Pencil from "vue-material-design-icons/Pencil.vue"
import AccountGroup from "vue-material-design-icons/AccountGroup.vue"

const authStore = useAuthStore()
const licenseStore = useLicenseStore()
const preCacheStore = usePreCacheStore()
const router = useRouter()

const showAllLicenses = ref(false)
// Load cached flags from localStorage, keyed langCode -> SVG string
const LANG_FLAGS_STORAGE_KEY = 'wl_lang_flags'
function loadCachedFlags() {
  try {
    const stored = localStorage.getItem(LANG_FLAGS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}
function saveFlagsToStorage(flags) {
  try {
    localStorage.setItem(LANG_FLAGS_STORAGE_KEY, JSON.stringify(flags))
  } catch { /* quota exceeded, ignore */ }
}
const langFlags = ref(loadCachedFlags())

const licenses = computed(() => licenseStore.state.licenses || [])
const hasLicenses = computed(() => licenses.value.length > 0)

const sortedLicenses = computed(() =>
  [...licenses.value].sort((a, b) => (b.usage?.words_translated ?? 0) - (a.usage?.words_translated ?? 0))
)
const visibleLicenses = computed(() =>
  showAllLicenses.value ? sortedLicenses.value : sortedLicenses.value.slice(0, 2)
)
const hasMoreLicenses = computed(() => sortedLicenses.value.length > 2)

const ringCircumference = 2 * Math.PI * 15.5 // ~97.39

function getRingOffset(license) {
  const pct = Math.min(license.usage?.usage_percentage ?? 0, 100)
  return ringCircumference - (ringCircumference * pct) / 100
}

function getPlanLabel(license) {
  if (license.type === 'free') return 'Free'
  if (license.type === 'manual') return 'Manual'
  const product = license.product || 'starter'
  return product.charAt(0).toUpperCase() + product.slice(1)
}

function getLicenseLanguages(license) {
  return license.settings?.languages || []
}

function getLangFlag(code) {
  return langFlags.value[code] || ''
}

async function fetchLangFlags(codes) {
  // Only fetch codes not already in our cache (includes localStorage hits)
  const missing = codes.filter((c) => !langFlags.value[c])
  if (missing.length === 0) return
  // Mark as loading to avoid duplicate requests
  missing.forEach((c) => { langFlags.value[c] = '' })
  await Promise.all(
    missing.map((code) =>
      api.get(`${config.appApiUrl}languages/${code}/flag`)
        .then((res) => { langFlags.value[code] = res.data?.flag || '' })
        .catch(() => {})
    )
  )
  // Persist all flags to localStorage
  saveFlagsToStorage(langFlags.value)
}

const greetings = [
  "Welcome back", // English
  "Bienvenue", // French
  "Bienvenido de nuevo", // Spanish
  "Willkommen zurück", // German
]

const currentGreeting = ref(greetings[0])
let greetingInterval = null

// Start pre-cache polling and fetch language flags once licenses are available
watch(
  () => licenseStore.state.licenses,
  (newLicenses) => {
    if (newLicenses && newLicenses.length > 0) {
      const ids = newLicenses.map((l) => l.id)
      preCacheStore.pollForLicenses(ids)

      // Collect all unique language codes and fetch their flags
      const allCodes = new Set()
      newLicenses.forEach((l) => {
        (l.settings?.languages || []).forEach((lang) => {
          if (lang.code) allCodes.add(lang.code)
        })
      })
      if (allCodes.size > 0) fetchLangFlags([...allCodes])
    }
  },
  { immediate: true }
)

onMounted(() => {
  let currentIndex = 0
  const totalGreetings = greetings.length

  greetingInterval = setInterval(() => {
    currentIndex++
    // Cycle through greetings once, then stop and reset to English
    currentGreeting.value = greetings[currentIndex % totalGreetings]
    if (currentIndex >= totalGreetings) {
      clearInterval(greetingInterval)
    }
  }, 4000)

  // Ensure licenses (with usage data) are loaded
  licenseStore.ensureLicensesLoaded()
})

onUnmounted(() => {
  clearInterval(greetingInterval)
  preCacheStore.stopAllPolling()
})
</script>

<template>
  <div class="overview-container max-1200 padding">
    <!-- Welcome Header -->
    <div class="welcome-section">
      <h2 class="page-title">
        <Transition name="slide-down" mode="out-in">
          <span :key="currentGreeting">{{ currentGreeting }}</span>
        </Transition><span v-if="authStore.user?.name?.trim() && authStore.user?.name !== 'user'">, {{ authStore.user.name }}</span>!
      </h2>
      <p class="page-subtitle">
        {{ $t("Here's what's happening with your websites today.") }}
      </p>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Quick Actions -->
      <div class="content-card">
        <h3 class="card-title">{{ $t('Quick Actions') }}</h3>
        <div class="quick-actions">
          <router-link to="/checkout" class="action-button">
            <span class="action-icon">
              <Plus
                size=40
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              />
            </span>
            <span>{{ $t('Add Website') }}</span>
          </router-link>
          <router-link to="/websites" class="action-button">
            <span class="action-icon">
              <Earth
                size=38
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              />
            </span>
            <span>{{ $t('Manage Translations') }}</span>
          </router-link>
          <router-link to="/edit-account" class="action-button">
            <span class="action-icon">
              <Pencil
                size=38
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              />
            </span>
            <span>{{ $t('Edit Account') }}</span>
          </router-link>
          <router-link to="/manage-users" class="action-button">
            <span class="action-icon">
              <AccountGroup
                size=38
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              />
            </span>
            <span>{{ $t('Manage Users') }}</span>
          </router-link>
        </div>
      </div>

      <!-- Notifications -->
      <div class="content-card notifications-card">
        <h3 class="card-title">{{ $t('Notifications') }}</h3>
        <Notifications :show_header="false" />
      </div>
    </div>

    <!-- Usage Overview (per-license) -->
    <div v-if="hasLicenses" class="usage-overview-section">
      <h3 class="section-title">{{ $t('Usage Overview') }}</h3>
      <div class="license-usage-list">
        <div
          v-for="license in visibleLicenses"
          :key="license.id"
          class="content-card license-usage-card"
        >
          <div class="license-usage-row">
          <div class="usage-row-left">
            <!-- Usage ring: only for free tier -->
            <div v-if="license.type === 'free'" class="usage-ring-wrapper">
              <svg class="usage-ring" viewBox="0 0 36 36">
                <circle class="usage-ring-bg" cx="18" cy="18" r="15.5" />
                <circle
                  class="usage-ring-fill"
                  cx="18" cy="18" r="15.5"
                  :stroke-dasharray="ringCircumference"
                  :stroke-dashoffset="getRingOffset(license)"
                />
              </svg>
              <span class="usage-ring-text">{{ Math.round(license.usage?.usage_percentage ?? 0) }}%</span>
            </div>
            <div class="usage-row-info">
              <div class="usage-row-top">
                <span class="license-domain">{{ license.domain_name || 'Unnamed License' }}</span>
                <span class="plan-badge" :class="license.type === 'free' ? 'plan-free' : 'plan-paid'">{{ getPlanLabel(license) }}</span>
              </div>
              <div class="usage-row-stats">
                <span class="usage-stat">{{ (license.usage?.words_translated ?? 0).toLocaleString() }} {{ $t('words translated') }}</span>
                <span class="usage-stat-sep">&middot;</span>
                <span class="usage-stat">{{ (license.usage?.translation_count ?? 0).toLocaleString() }} {{ $t('requests') }}</span>
                <template v-if="license.settings?.analytics_enabled && (license.usage?.total_visits ?? 0) > 0">
                  <span class="usage-stat-sep">&middot;</span>
                  <span class="usage-stat">{{ (license.usage.total_visits).toLocaleString() }} {{ $t('visits') }}</span>
                </template>
                <template v-if="getLicenseLanguages(license).length > 0">
                  <span class="usage-stat-sep">&middot;</span>
                  <span class="usage-langs">
                    <span
                      v-for="lang in getLicenseLanguages(license)"
                      :key="lang.code"
                      class="usage-lang"
                      :title="lang.name"
                    >
                      <span v-if="getLangFlag(lang.code)" class="lang-flag" v-html="getLangFlag(lang.code)"></span>
                      <span v-else class="lang-code">{{ lang.code }}</span>
                    </span>
                  </span>
                </template>
              </div>
            </div>
          </div>
          <button
            class="btn btn-small btn-outline see-more-btn"
            @click="router.push({ name: 'manage-license-analytics', params: { id: license.id } })"
          >
            {{ $t('See More') }}
          </button>
          </div>
        <!-- Pre-cache progress bar in card footer -->
        <PreCacheProgressBar
          v-if="preCacheStore.isActive(license.id)"
          :percentage="preCacheStore.getStatus(license.id)?.percentage || 0"
          :pages-discovered="preCacheStore.getStatus(license.id)?.pages_discovered || 0"
          :pages-translated="preCacheStore.getStatus(license.id)?.pages_translated || 0"
          :status="preCacheStore.getStatus(license.id)?.status || 'running'"
          compact
          class="precache-card-bar"
        />
        </div>
      </div>
      <button
        v-if="hasMoreLicenses"
        class="show-more-btn"
        @click="showAllLicenses = !showAllLicenses"
      >
        {{ showAllLicenses ? $t('Show Less') : $t('Show More') }} ({{ sortedLicenses.length - 2 }} {{ $t('more') }})
      </button>
    </div>

    <!-- Pre-Cache Toast (bottom-left) -->
    <PreCacheToast />
  </div>
</template>

<style scoped>
/* Pre-cache bar in usage card */
.precache-card-bar {
  padding: 0 1.25rem 0.75rem 1.25rem;
}

/* Greeting Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.page-title span {
  display: inline-block;
  transition: all 0.2s ease;
}
.overview-container {
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

.welcome-section {
  margin: 2rem 0 3rem 0;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  transition: all 0.2s ease;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
}

.notifications-wrapper {
  text-align: left;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: var(--shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--bg-hover);
}

.stat-blue .stat-icon {
  background: rgba(102, 126, 234, 0.1);
}
.stat-green .stat-icon {
  background: rgba(34, 197, 94, 0.1);
}
.stat-purple .stat-icon {
  background: rgba(168, 85, 247, 0.1);
}
.stat-orange .stat-icon {
  background: rgba(251, 146, 60, 0.1);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

/* Content Grid */
.content-grid {
  margin-top: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.content-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: start;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.activity-item:hover {
  background: var(--bg-hover);
}

.activity-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border-radius: 50%;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-action {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.activity-site {
  font-weight: 500;
}

.activity-time::before {
  content: "•";
  margin-right: 0.5rem;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: var(--bg-hover);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.action-button:hover {
  background: var(--accent-color);
  color: white;
  transform: translateY(-2px);
}

.action-icon {
  font-size: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px; /* To vertically align all icons */
}

/* Usage Overview Section */
.usage-overview-section {
  margin-bottom: 2rem;
}
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 2rem 0 1rem 0 !important;
}
.license-usage-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.license-usage-card {
  padding: 0;
}
.license-usage-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
}
.usage-row-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

/* SVG ring chart */
.usage-ring-wrapper {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}
.usage-ring {
  width: 44px;
  height: 44px;
  transform: rotate(-90deg);
}
.usage-ring-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 3;
}
.usage-ring-fill {
  fill: none;
  stroke: #667eea;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.8s ease;
}
.usage-ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--text-primary);
}

.usage-row-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  text-align: left;
}
.usage-row-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.license-domain {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}
.plan-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.plan-free {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
  color: #667eea;
}
.plan-paid {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}
.usage-row-stats {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 2px;
  flex-wrap: wrap;
}
.usage-stat {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.usage-stat-sep {
  font-size: 0.7rem;
  color: var(--text-secondary);
  opacity: 0.5;
}
.usage-langs {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.usage-lang {
  display: inline-flex;
  align-items: center;
}
.lang-flag {
  display: inline-flex;
  align-items: center;
  width: 18px;
  height: 13px;
}
.lang-flag :deep(svg) {
  width: 18px;
  height: 13px;
  border-radius: 2px;
}
.lang-code {
  font-size: 0.65rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
}

.see-more-btn {
  flex-shrink: 0;
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: none;
  color: var(--accent-color, #667eea);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.see-more-btn:hover {
  background: rgba(102, 126, 234, 0.08);
  border-color: var(--accent-color, #667eea);
}

.show-more-btn {
  display: block;
  margin: 0.75rem auto 0;
  padding: 0.5rem 1.5rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.show-more-btn:hover {
  border-color: var(--accent-color, #667eea);
  color: var(--accent-color, #667eea);
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  .notifications-card{
    display: none;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
