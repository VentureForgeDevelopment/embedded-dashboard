<template>
  <div class="embedded-overview-container">
    <div class="welcome-content">
      <h2 class="welcome-title">Welcome to your WebLinguist Dashboard!</h2>
      <p class="welcome-subtitle">
        You can manage all of your website's translation options and settings
        through this interface.
      </p>
    </div>

    <div v-if="activeLicense">
      <div v-if="activeLicense.subscription_id === null">
        <!-- Active license exists but is free, prompt to upgrade -->
        <UpgradePrompt
          title="Unlock More Features"
          description="You currently have a free license. Upgrade to a paid plan to access advanced translation features, more languages, and enhanced customization options."
          button-text="Upgrade Your License"
          :upgrade-route="{
            name: 'checkout',
            params: { type: 'upgrade-free', id: activeLicense.id },
          }"
        />
      </div>
      <div v-else>
        <!-- Active license exists and is paid, provide link to manage it -->
        <div class="manage-license-prompt">
          <h3 class="manage-license-title">Manage Your Website</h3>
          <p class="manage-license-description">
            You have an active WebLinguist license. Click below to customize
            your translation settings and manage your website.
          </p>
          <router-link
            :to="{ name: 'manage-license', params: { id: activeLicense.id } }"
            class="btn btn-primary manage-license-btn"
          >
            Go to Customize Page
          </router-link>
        </div>
      </div>
    </div>
    <div v-else>
      <!-- No active license, prompt to create a free one -->
      <UpgradePrompt
        title="Let's Get You Set Up"
        description="To start translating your website, you first need to create a free license. This will connect your site to the WebLinguist service and activate your translation toolbar."
        button-text="Create Free License"
        :upgrade-route="{ name: 'checkout', query: { plan: 'free' } }"
      />
    </div>
  </div>
</template>

<script setup>
import UpgradePrompt from "../components/UpgradePrompt.vue"
import { computed } from "vue"
import { useLicenseStore } from "../stores/license"

const licenseStore = useLicenseStore()

const activeLicense = computed(() => {
  return licenseStore.state.active_license
})
</script>

<style scoped>
.embedded-overview-container {
  padding: 0.5rem 2rem;
  max-width: 800px;
  margin: 4rem auto;
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-content {
  margin-bottom: 3rem;
}

.welcome-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.welcome-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.manage-license-prompt {
  padding: 2.5rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.manage-license-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
}

.manage-license-description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.manage-license-btn {
  /* Reuse btn-primary styles from UpgradePrompt or define here */
}
</style>
