<template>
  <div class="analytics-page">
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

    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div class="header-title">
          <svg
            class="icon-large icon-blue"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20V16" />
          </svg>
          <h1>{{ $t('Analytics') }}</h1>
        </div>
        <div class="analytics-toggle">
          <span class="toggle-label">{{ $t('Track Visits') }}</span>
          <label class="toggle-switch" :class="{ disabled: isTogglingAnalytics }">
            <input
              type="checkbox"
              :checked="analyticsEnabled"
              :disabled="isTogglingAnalytics"
              @change="toggleAnalytics"
            />
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-assurance">{{ $t('Data tracked anonymously. GDPR compliant.') }}</span>
        </div>
      </div>
      <p class="header-subtitle">
        {{ $t('View usage statistics and user engagement for your license.') }}
      </p>
    </div>

    <!-- Time Period Filters -->
    <div class="filters">
      <button
        v-for="period in timePeriods"
        :key="period.value"
        @click="activePeriod = period.value"
        :class="[
          'btn',
          'btn-small',
          activePeriod === period.value ? 'btn-primary' : 'btn-outline',
        ]"
      >
        {{ period.label }}
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="skeleton-container">
      <div class="skeleton-hero skeleton-pulse"></div>
      <div class="skeleton-grid">
        <div class="skeleton-card skeleton-pulse" v-for="n in 4" :key="n"></div>
      </div>
      <div class="skeleton-chart skeleton-pulse"></div>
    </div>

    <!-- Analytics Content -->
    <div v-else>
      <!-- Word Usage Hero Card -->
      <div class="overview-card hero-card">
        <h2 class="card-title">{{ $t('Words Translated') }}</h2>
        <div class="hero-content">
          <!-- Free tier: Doughnut chart -->
          <div v-if="isFreeOrLimited" class="doughnut-container">
            <canvas ref="doughnutCanvas"></canvas>
            <div class="doughnut-center">
              <span class="doughnut-percentage">{{ usagePercentage }}%</span>
              <span class="doughnut-label">{{ $t('used') }}</span>
            </div>
          </div>
          <!-- Paid/unlimited tiers: Large number -->
          <div v-else class="unlimited-container">
            <div class="unlimited-number">{{ animatedWords.toLocaleString() }}</div>
            <div class="unlimited-label">{{ $t('words translated') }}</div>
            <span class="unlimited-badge">{{ $t('Unlimited') }}</span>
          </div>
          <div class="hero-details">
            <div class="hero-detail-item">
              <span class="hero-detail-label">{{ $t('Words Used') }}</span>
              <span class="hero-detail-value">{{ summary.words_translated.toLocaleString() }}</span>
            </div>
            <div v-if="isFreeOrLimited" class="hero-detail-item">
              <span class="hero-detail-label">{{ $t('Monthly Limit') }}</span>
              <span class="hero-detail-value">{{ limitData.monthly_word_limit?.toLocaleString() ?? '---' }}</span>
            </div>
            <div v-if="isFreeOrLimited" class="hero-detail-item">
              <span class="hero-detail-label">{{ $t('Remaining') }}</span>
              <span class="hero-detail-value">{{ limitData.current_period_remaining?.toLocaleString() ?? '---' }}</span>
            </div>
            <div class="hero-detail-item">
              <span class="hero-detail-label">{{ $t('Total Visits') }}</span>
              <span v-if="analyticsEnabled" class="hero-detail-value">{{ summary.total_visits?.toLocaleString() ?? '0' }}</span>
              <span v-else class="hero-detail-value hero-detail-disabled">{{ $t('Not enabled') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Visits by Country Card -->
      <div class="overview-card country-card" v-if="sortedCountries.length > 0">
        <h2 class="card-title">{{ $t('Visits by Country') }}</h2>
        <div class="country-table">
          <div class="country-row country-header">
            <span class="country-name-col">{{ $t('Country') }}</span>
            <span class="country-count-col">{{ $t('Visits') }}</span>
            <span class="country-bar-col">{{ $t('Share') }}</span>
          </div>
          <div
            v-for="country in displayedCountries"
            :key="country.code"
            class="country-row"
          >
            <span class="country-name-col">
              <span class="country-flag" v-html="countryFlag(country.code)"></span>
              {{ countryName(country.code) }}
            </span>
            <span class="country-count-col">{{ country.count.toLocaleString() }}</span>
            <span class="country-bar-col">
              <div class="country-bar-bg">
                <div
                  class="country-bar-fill"
                  :style="{ width: country.percentage + '%' }"
                ></div>
              </div>
              <span class="country-pct">{{ country.percentage.toFixed(1) }}%</span>
            </span>
          </div>
        </div>
        <button
          v-if="sortedCountries.length > 10"
          class="btn btn-small btn-outline show-all-btn"
          @click="showAllCountries = !showAllCountries"
        >
          {{ showAllCountries ? $t('Show top 10') : $t('Show all') + ` (${sortedCountries.length})` }}
        </button>
      </div>

      <!-- Metrics Cards -->
      <div class="metrics-grid">
        <div class="overview-card metric-card" v-for="metric in metrics" :key="metric.label">
          <div class="metric-icon" v-html="metric.icon"></div>
          <div class="metric-value">{{ metric.value.toLocaleString() }}</div>
          <div class="metric-label">{{ metric.label }}</div>
          <div class="metric-description">{{ metric.description }}</div>
        </div>
      </div>

      <!-- Usage History Chart -->
      <div class="overview-card chart-card" v-if="history.length > 0">
        <h2 class="card-title">{{ $t('Monthly Usage') }}</h2>
        <div class="chart-container">
          <canvas ref="barCanvas"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue"
import { useLicenseStore } from "../../stores/license"
import { Chart, registerables } from "chart.js"
import SlideInNotification from "../SlideInNotification.vue"

Chart.register(...registerables)

const props = defineProps({
  license: {
    type: Object,
    required: true,
  },
})

const licenseStore = useLicenseStore()

const activePeriod = ref("30d")
const doughnutCanvas = ref(null)
const barCanvas = ref(null)
let doughnutChart = null
let barChart = null
const animatedWords = ref(0)
const isTogglingAnalytics = ref(false)
const showSuccessNotification = ref(false)
const successMessage = ref("")
const showFailNotification = ref(false)
const failMessage = ref("")

const analyticsEnabled = computed(() => {
  return props.license?.settings?.analytics_enabled === true
})

async function toggleAnalytics(event) {
  const newValue = event.target.checked
  isTogglingAnalytics.value = true
  try {
    await licenseStore.updateSingleLicenseSetting({
      license_id: props.license.id,
      setting_key: 'analytics_enabled',
      setting_value: newValue,
    })
    successMessage.value = newValue
      ? "Visitor tracking enabled successfully."
      : "Visitor tracking disabled successfully."
    showSuccessNotification.value = true
    setTimeout(() => showSuccessNotification.value = false, 3000)
  } catch (err) {
    console.error("Failed to toggle analytics:", err)
    event.target.checked = !newValue
    failMessage.value = "Failed to update visitor tracking setting."
    showFailNotification.value = true
    setTimeout(() => showFailNotification.value = false, 3000)
  } finally {
    isTogglingAnalytics.value = false
  }
}

// Fetch max history to determine how many periods exist
const availableHistory = ref([])

const timePeriods = computed(() => {
  const periods = [{ label: "Current Month", value: "30d" }]
  if (availableHistory.value.length >= 2) {
    periods.push({ label: "Last 2 Months", value: "60d" })
  }
  if (availableHistory.value.length >= 3) {
    periods.push({ label: "Last 3 Months", value: "90d" })
  }
  return periods
})

const daysMap = { "30d": 30, "60d": 60, "90d": 90 }

const isLoading = computed(() => licenseStore.state.loading.usage)
const usage = computed(() => licenseStore.state.usage)
const countryFlags = computed(() => usage.value?.country_flags ?? {})
const showAllCountries = ref(false)

const summary = computed(() => usage.value?.summary ?? {
  words_translated: 0,
  translation_count: 0,
  tts_characters_processed: 0,
  tts_request_count: 0,
  visits_by_country: {},
  total_visits: 0,
})
const limitData = computed(() => usage.value?.limit ?? {
  monthly_word_limit: null,
  current_period_words_used: 0,
  current_period_remaining: null,
  usage_percentage: 0,
  plan_type: 'free',
})
const history = computed(() => usage.value?.history ?? [])

const isFreeOrLimited = computed(() => {
  return limitData.value.monthly_word_limit !== null
})

const usagePercentage = computed(() => {
  return Math.round(limitData.value.usage_percentage ?? 0)
})

const planLabel = computed(() => {
  const pt = limitData.value.plan_type
  if (!pt) return 'Free'
  return pt.charAt(0).toUpperCase() + pt.slice(1)
})

const sortedCountries = computed(() => {
  const data = summary.value.visits_by_country ?? {}
  const total = summary.value.total_visits || 1
  return Object.entries(data)
    .map(([code, count]) => ({
      code,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)
})

const displayedCountries = computed(() => {
  if (showAllCountries.value) return sortedCountries.value
  return sortedCountries.value.slice(0, 10)
})

const COUNTRY_NAMES = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  DE: 'Germany', FR: 'France', ES: 'Spain', IT: 'Italy', PT: 'Portugal',
  NL: 'Netherlands', BE: 'Belgium', AT: 'Austria', CH: 'Switzerland',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', PL: 'Poland',
  CZ: 'Czech Republic', SK: 'Slovakia', HU: 'Hungary', RO: 'Romania',
  BG: 'Bulgaria', HR: 'Croatia', SI: 'Slovenia', RS: 'Serbia', UA: 'Ukraine',
  RU: 'Russia', TR: 'Turkey', GR: 'Greece', IE: 'Ireland', IS: 'Iceland',
  JP: 'Japan', KR: 'South Korea', CN: 'China', TW: 'Taiwan', HK: 'Hong Kong',
  SG: 'Singapore', MY: 'Malaysia', TH: 'Thailand', VN: 'Vietnam', PH: 'Philippines',
  ID: 'Indonesia', IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka',
  BR: 'Brazil', MX: 'Mexico', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
  PE: 'Peru', VE: 'Venezuela', EC: 'Ecuador', UY: 'Uruguay', PY: 'Paraguay',
  ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', EG: 'Egypt', MA: 'Morocco',
  GH: 'Ghana', TZ: 'Tanzania', ET: 'Ethiopia', SA: 'Saudi Arabia', AE: 'UAE',
  IL: 'Israel', QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain', OM: 'Oman',
  NZ: 'New Zealand', XX: 'Unknown',
}

function countryName(code) {
  return COUNTRY_NAMES[code] || code
}

function countryFlag(code) {
  if (countryFlags.value[code]) return countryFlags.value[code]
  if (code === 'XX') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
  return ''
}

const metrics = computed(() => [
  {
    label: "Translation Requests",
    value: summary.value.translation_count,
    description: "Number of translation batch operations processed",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`,
  },
  {
    label: "Total Visits",
    value: summary.value.total_visits,
    description: "Unique visitor sessions tracked by country",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
  {
    label: "TTS API Calls",
    value: summary.value.tts_request_count,
    description: "Text-to-speech synthesis requests",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
  },
  {
    label: "TTS Characters",
    value: summary.value.tts_characters_processed,
    description: "Total characters processed for speech synthesis",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`,
  },
])

function fetchUsage() {
  if (!props.license?.id) return
  licenseStore.getLicenseUsage({
    license_id: props.license.id,
    days: daysMap[activePeriod.value],
  }).then(() => {
    nextTick(() => {
      renderCharts()
      animateWordCount()
    })
  }).catch((err) => {
    console.error("Failed to fetch usage analytics:", err)
  })
}

// Fetch max range once on mount to determine how many billing periods exist
function fetchAvailableHistory() {
  if (!props.license?.id) return
  licenseStore.getLicenseUsage({
    license_id: props.license.id,
    days: 90,
  }).then((res) => {
    availableHistory.value = res.data?.data?.history ?? []
    // Now fetch with the default period
    fetchUsage()
  }).catch(() => {
    fetchUsage()
  })
}

function animateWordCount() {
  const target = summary.value.words_translated
  if (!isFreeOrLimited.value && target > 0) {
    const duration = 1200
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4)
      animatedWords.value = Math.round(target * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  } else {
    animatedWords.value = target
  }
}

function renderCharts() {
  renderDoughnut()
  renderBarChart()
}

function renderDoughnut() {
  if (!doughnutCanvas.value || !isFreeOrLimited.value) return
  if (doughnutChart) doughnutChart.destroy()

  const used = limitData.value.current_period_words_used ?? 0
  const remaining = limitData.value.current_period_remaining ?? 0

  doughnutChart = new Chart(doughnutCanvas.value, {
    type: "doughnut",
    data: {
      labels: ["Used", "Remaining"],
      datasets: [
        {
          data: [used, remaining],
          backgroundColor: ["rgba(102, 126, 234, 0.9)", "rgba(229, 231, 235, 0.6)"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      cutout: "75%",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw.toLocaleString()} words`,
          },
        },
      },
      animation: {
        duration: 1200,
        easing: "easeOutQuart",
      },
    },
  })
}

function renderBarChart() {
  if (!barCanvas.value || history.value.length === 0) return
  if (barChart) barChart.destroy()

  const labels = history.value.map((h) => {
    const start = new Date(h.period_start)
    return start.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  })
  const wordsData = history.value.map((h) => h.words_translated)
  const visitsData = history.value.map((h) => h.total_visits ?? 0)

  const hasVisits = visitsData.some((v) => v > 0)

  const datasets = [
    {
      label: "Words Translated",
      data: wordsData,
      backgroundColor: "rgba(102, 126, 234, 0.75)",
      borderColor: "#667eea",
      borderWidth: 1,
      borderRadius: 6,
      yAxisID: "y",
    },
  ]

  if (hasVisits) {
    datasets.push({
      label: "Total Visits",
      data: visitsData,
      backgroundColor: "rgba(16, 185, 129, 0.6)",
      borderColor: "#10b981",
      borderWidth: 1,
      borderRadius: 6,
      yAxisID: "y1",
    })
  }

  barChart = new Chart(barCanvas.value, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: hasVisits, position: "top" },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const suffix = ctx.dataset.yAxisID === "y1" ? " visits" : " words"
              return `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}${suffix}`
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.05)" },
          ticks: { callback: (v) => v.toLocaleString() },
          position: "left",
        },
        ...(hasVisits ? {
          y1: {
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { callback: (v) => v.toLocaleString() },
            position: "right",
          },
        } : {}),
        x: {
          grid: { display: false },
        },
      },
      animation: {
        duration: 1200,
        easing: "easeOutQuart",
      },
    },
  })
}

watch(activePeriod, (newVal) => {
  // Guard: if selected period no longer exists in options, reset to current month
  if (!timePeriods.value.find(p => p.value === newVal)) {
    activePeriod.value = '30d'
    return
  }
  fetchUsage()
})

onMounted(() => {
  fetchAvailableHistory()
})

onUnmounted(() => {
  if (doughnutChart) doughnutChart.destroy()
  if (barChart) barChart.destroy()
})
</script>

<style scoped>
.analytics-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  margin-bottom: 32px;
}
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-title h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary, #111827);
}
.header-subtitle {
  font-size: 16px;
  color: var(--text-secondary, #6b7280);
  text-align: left;
}
.icon-large {
  width: 32px;
  height: 32px;
}
.icon-blue {
  color: #2563eb;
}

/* Analytics Toggle */
.analytics-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.toggle-assurance {
  font-size: 10px;
  color: var(--text-secondary, #9ca3af);
  width: 100%;
}
.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}
.toggle-switch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  inset: 0;
  background-color: #d1d5db;
  border-radius: 24px;
  transition: background-color 0.2s;
}
.toggle-slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.2s;
}
.toggle-switch input:checked + .toggle-slider {
  background-color: #667eea;
}
.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

/* Skeleton Loading */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.skeleton-pulse {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-hero {
  height: 280px;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.skeleton-card {
  height: 140px;
}
.skeleton-chart {
  height: 340px;
}

/* Overview Card */
.overview-card {
  background: var(--bg-secondary, white);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,0.1));
}
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 20px 0;
}

/* Hero Card */
.hero-card {
  margin-bottom: 24px;
}
.hero-content {
  display: flex;
  align-items: center;
  gap: 48px;
}

/* Doughnut */
.doughnut-container {
  position: relative;
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}
.doughnut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
}
.doughnut-percentage {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  line-height: 1;
}
.doughnut-label {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  margin-top: 4px;
}

/* Unlimited */
.unlimited-container {
  text-align: center;
  flex-shrink: 0;
  min-width: 200px;
}
.unlimited-number {
  font-size: 48px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  line-height: 1;
}
.unlimited-label {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  margin-top: 8px;
}
.unlimited-badge {
  display: inline-block;
  margin-top: 12px;
  padding: 4px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

/* Hero Details */
.hero-details {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.hero-detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hero-detail-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary, #9ca3af);
  font-weight: 600;
}
.hero-detail-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  line-height: 1.2;
}
.hero-detail-disabled {
  font-size: 13px;
  font-weight: 500;
  font-style: italic;
  color: var(--text-secondary, #9ca3af);
}
.plan-badge {
  font-size: 20px;
  color: rgba(102, 126, 234, 1);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}
.metric-card {
  text-align: center;
}
.metric-icon {
  color: var(--text-secondary, #6b7280);
  margin-bottom: 12px;
}
.metric-icon :deep(svg) {
  width: 28px;
  height: 28px;
}
.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  margin-bottom: 4px;
}
.metric-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #374151);
  margin-bottom: 4px;
}
.metric-description {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

/* Country Card */
.country-card {
  margin-bottom: 24px;
}
.country-table {
  width: 100%;
}
.country-row {
  display: grid;
  grid-template-columns: 1fr 100px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.country-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}
.country-name-col {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-primary, #111827);
}
.country-flag {
  display: inline-flex;
  align-items: center;
  width: 22px;
  height: 16px;
  flex-shrink: 0;
}
.country-flag :deep(svg) {
  width: 22px;
  height: 16px;
  border-radius: 2px;
}
.country-count-col {
  text-align: right;
  font-weight: 600;
  color: var(--text-primary, #111827);
  font-variant-numeric: tabular-nums;
}
.country-bar-col {
  display: flex;
  align-items: center;
  gap: 8px;
}
.country-bar-bg {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
}
.country-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.6s ease;
}
.country-pct {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  min-width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.show-all-btn {
  margin-top: 12px;
}

/* Chart Card */
.chart-card {
  margin-bottom: 24px;
}
.chart-container {
  height: 300px;
  position: relative;
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-content {
    flex-direction: column;
    gap: 24px;
    align-items: flex-start;
  }
  .metrics-grid,
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .country-row {
    grid-template-columns: 1fr 80px 1fr;
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
