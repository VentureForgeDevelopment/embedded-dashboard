<template>
  <div class="agency-container max-1200 padding">
    <div class="agency-content">
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">Agency</h1>
          </div>
        </div>
      </div>
      <div class="main-tabs-nav">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'revenue-kit' }"
          @click="navigateToRevenueKitTab"
        >
          Revenue Kit
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'profit-calculator' }"
          @click="navigateToProfitCalculatorTab"
        >
          Multilingual Revenue Calculator
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'agency-progress-tracker' }"
          @click="navigateToAgencyProgressTrackerTab"
        >
          Agency Progress Tracker
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'revenue-kit'" class="main-tab-pane">
      <RevenueKit />
    </div>

    <div v-if="activeTab === 'profit-calculator'" class="main-tab-pane">
      <ProfitCalculator />
    </div>
    <div v-if="activeTab === 'agency-progress-tracker'" class="main-tab-pane">
      <ProgressTracker />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import ProfitCalculator from "../components/Referrals/ProfitCalculator.vue"
import RevenueKit from "../components/Referrals/RevenueKit.vue"
import ProgressTracker from "../components/ProgressTracker.vue"

const route = useRoute()
const router = useRouter()

const activeTab = ref("revenue-kit")

const navigateToProfitCalculatorTab = () => {
  router.push({ name: "agency-profit-calculator" })
}
const navigateToRevenueKitTab = () => {
  router.push({ name: "agency-revenue-kit" })
}
const navigateToAgencyProgressTrackerTab = () => {
  router.push({ name: "agency-progress-tracker" })
}

// Initialize tabs from route and watch for changes
const syncTabsWithRoute = () => {
  const routeName = route.name

  if (routeName === "agency") {
    activeTab.value = "revenue-kit"
  } else if (routeName === "agency-profit-calculator") {
    activeTab.value = "profit-calculator"
  } else if (routeName === "agency-revenue-kit") {
    activeTab.value = "revenue-kit"
  } else if (routeName === "agency-progress-tracker") {
    activeTab.value = "agency-progress-tracker"
  }
}

// Watch route changes
watch(
  () => route.name,
  () => {
    syncTabsWithRoute()
  }
)

// Call on mount to set the initial tab state
onMounted(() => {
  syncTabsWithRoute()
})
</script>

<style scoped></style>
