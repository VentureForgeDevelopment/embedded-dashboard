<template>
  <div class="manage-license-container max-1200 padding">
    <!-- Loading State -->
    <!-- <div v-if="loading && !referrals" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading referrals...</p>
    </div> -->

    <!-- License Details -->
    <div class="license-content">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">Affiliates</h1>
          </div>
        </div>
      </div>

      <!-- Main Tabs -->
      <div class="main-tabs-nav">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'referrals' }"
          @click="navigateToReferralsTab"
        >
          Referrals
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'payouts' }"
          @click="navigateToPayoutsTab"
        >
          Payouts
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'ads' }"
          @click="navigateToAdsTab"
        >
          Ads
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'howItWorks' }"
          @click="navigateToHowItWorksTab"
        >
          <AlertCircleOutline
            style="
              display: inline-flex;
              justify-content: center;
              align-items: center;
              margin-right: 0.5rem;
            "
          />
          How It Works
        </button>
      </div>

      <!-- General Tab Content -->
      <div v-if="activeTab === 'referrals'" class="main-tab-pane">
        <div class="overview-section">
          <LinkGenerator />
          <Stats :stats="stats" />
          <ReferralList :referrals="referrals" />
        </div>
      </div>

      <!-- customize tab content -->
      <div v-if="activeTab === 'payouts'" class="main-tab-pane">
        <Payouts />
      </div>

      <div v-if="activeTab === 'ads'" class="main-tab-pane">
        <div class="overview-section">
          <Ads />
        </div>
      </div>

      <div v-if="activeTab === 'howItWorks'" class="main-tab-pane">
        <div class="overview-section">
          <HowItWorks />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import LinkGenerator from "../components/Referrals/LinkGenerator.vue"
import ReferralList from "../components/Referrals/ReferralList.vue"
import Payouts from "../components/Referrals/Payouts.vue"
import Stats from "../components/Referrals/Stats.vue"
import { useAuthStore } from "../stores/auth"
import Ads from "../components/Referrals/Ads.vue"
import HowItWorks from "../components/Referrals/HowItWorks.vue"
import AlertCircleOutline from "vue-material-design-icons/AlertCircleOutline.vue"

export default {
  name: "ReferralsView",
  components: {
    LinkGenerator,
    ReferralList,
    Stats,
    Payouts,
    Ads,
    HowItWorks,
    AlertCircleOutline,
  },
  setup() {
    const authStore = useAuthStore()

    const route = useRoute()
    const router = useRouter()
    const activeTab = ref("referrals")

    const referrals = computed(() => {
      return authStore.referrals
    })

    const stats = computed(() => {
      const totalReferrals = referrals.value?.length || 0

      if (totalReferrals === 0) {
        return {
          pending_conversions: 0,
          overall_conversions: 0,
          conversion_rate: 0,
        }
      }

      const overall_conversions = referrals.value.filter(
        (r) => r.converted
      ).length
      const pending_conversions = totalReferrals - overall_conversions
      const conversion_rate = (overall_conversions / totalReferrals) * 100

      return {
        pending_conversions,
        overall_conversions,
        conversion_rate: conversion_rate.toFixed(2),
      }
    })

    const navigateToReferralsTab = () => {
      router.push({ name: "referrals" })
    }
    const navigateToPayoutsTab = () => {
      router.push({ name: "referrals-payouts" })
    }
    const navigateToAdsTab = () => {
      router.push({ name: "referrals-ads" })
    }
    const navigateToHowItWorksTab = () => {
      router.push({ name: "referrals-how-it-works" })
    }

    // Initialize tabs from route and watch for changes
    const syncTabsWithRoute = () => {
      const routeName = route.name

      if (routeName === "referrals") {
        activeTab.value = "referrals"
      } else if (routeName === "referrals-payouts") {
        activeTab.value = "payouts"
      } else if (routeName === "referrals-ads") {
        activeTab.value = "ads"
      } else if (routeName === "referrals-how-it-works") {
        activeTab.value = "howItWorks"
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

      authStore.getReferrals()
    })

    return {
      //components
      LinkGenerator,
      ReferralList,
      Stats,
      Payouts,
      Ads,
      HowItWorks,
      AlertCircleOutline,
      //data
      activeTab,
      referrals,
      stats,
      //methods
      navigateToReferralsTab,
      navigateToPayoutsTab,
      navigateToAdsTab,
      navigateToHowItWorksTab
    }
  },
}
</script>
