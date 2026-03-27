<template>
  <div class="overview-card installation-card">
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
    <div class="installation-card-header">
      <h3 class="card-title">{{ $t('Installation Setup') }}</h3>
      <p class="installation-description">
        {{ $t('Choose your preferred installation method to activate your license') }}
      </p>
    </div>
    <div class="installation-mode-switcher">
      <button
        @click="mode = 'script'"
        :class="{ active: mode === 'script' }"
        class="mode-button"
      >
        {{ $t('Script') }}
      </button>
      <button
        @click="mode = 'dns'"
        :class="[
          'mode-button',
          { active: mode === 'dns' },
          { 'btn-disabled': is_dns_restricted },
        ]"
      >
        DNS
        <span
          v-if="isDnsEnabled"
          style="margin-left: 0.5rem"
          class="status-indicator enabled-badge"
        >
          {{ $t('Enabled') }}
          <span v-if="isDnsEnabledAndUnverified" class="enabled-badge-asterisk"
            >*</span
          >
        </span>
        <span v-if="is_dns_restricted" class="premium-badge">{{ $t('Growth') }}</span>
      </button>
    </div>
    <div class="card-content">
      <!-- Script Installation -->
      <div v-if="mode === 'script'" class="installation-info">
        <div v-if="isEmbedded" class="embedded-installation-overlay">
          <div class="overlay-content">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="overlay-icon"
            >
              <path
                fill-rule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clip-rule="evenodd"
              />
            </svg>
            <h4>{{ $t('Installation Handled Automatically') }}</h4>
            <p v-if="isShopifyPlatform">
              {{ $t('To display the language switcher on your storefront, go to your Shopify theme editor and enable the Web Linguist app embed toggle in your theme settings.') }}
            </p>
            <p v-else>
              {{ $t('Because you are using the WebLinguist WordPress plugin, your installation script is automatically embedded into your site.') }}
            </p>
          </div>
        </div>
        <div class="card-header">
          <div class="script-embed-header">
            <h4 class="card-title">{{ $t('Script') }}</h4>
            <p class="installation-description">
              {{ $t('Copy and paste this script into your browser console on any website:') }}
            </p>
          </div>
        </div>
        <button
          class="btn btn-small"
          :class="{ 'btn-success': copiedScript }"
          @click="copyInstallationScript"
          :disabled="isEmbedded"
        >
          {{ copiedScript ? $t("Copied!") : $t("Copy") }}
        </button>

        <pre class="installation-script">{{ installationScript }}</pre>
      </div>

      <!-- DNS Setup -->
      <div v-if="mode === 'dns'" class="dns-setup">
        <div class="dns-setup-box">
          <!-- Card header — always visible across all steps -->
          <div class="card-header">
            <div class="script-embed-header">
              <h4 class="card-title">{{ $t('Manual DNS') }}</h4>
              <p v-if="dnsStep === 3" class="installation-description">
                {{ $t('Add these DNS records manually in your domain provider') }}
              </p>
            </div>
            <div class="manual-status">
              <span v-if="isDnsEnabled" class="status-indicator enabled-badge"
                >{{ $t('Enabled') }}</span
              >
              <span class="status-indicator" :class="verificationStatusClass">{{
                verificationStatusText
              }}</span>
            </div>
          </div>

          <!-- Stepped content with transition -->
          <div class="dns-step-container">
            <Transition :name="transitionName" mode="out-in">

              <!-- Step 1: Introduction + Enable Toggle -->
              <div v-if="dnsStep === 1" key="step1" class="dns-step-page">
                <div class="dns-intro">
                  <p class="dns-intro-notice">
                    {{ $t('The DNS setup is an optional but advanced setup method. This method is required to enable fully qualified URLs.') }}
                  </p>
                </div>
                <div class="toggle-group">
                  <label class="toggle-label" @click.stop>
                    <input
                      type="checkbox"
                      class="toggle-checkbox"
                      :checked="isDnsEnabled"
                      @change="toggleDnsConfiguration"
                      :disabled="isVerifying"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="toggle-text">{{
                    isDnsEnabled
                      ? $t("Manual DNS Setup Enabled")
                      : $t("Enable Manual DNS Setup")
                  }}</span>
                </div>
                <div v-if="isDnsEnabled" class="dns-step-nav">
                  <button class="btn btn-primary" @click="goToStep(2)">{{ $t('Continue') }} &rarr;</button>
                </div>
              </div>

              <!-- Step 2: Hosting Provider Selection -->
              <div v-else-if="dnsStep === 2" key="step2" class="dns-step-page">
                <div class="hosting-provider-section">
                  <label class="hosting-provider-label">{{ $t('Select your hosting provider') }}</label>
                  <select v-model="selectedProvider" class="hosting-provider-select full-width" @change="onProviderChange">
                    <option value="standard">{{ $t('Standard (VPS / cPanel / Shared Hosting)') }}</option>
                    <option value="wpengine">WP Engine</option>
                    <option value="kinsta">Kinsta</option>
                    <option value="flywheel">Flywheel</option>
                    <option value="other_managed">{{ $t('Other Managed Host') }}</option>
                  </select>
                </div>

                <!-- Managed Host Origin Input -->
                <div v-if="isManagedHost" class="managed-host-section">
                  <label class="hosting-provider-label">{{ managedHostLabel }}</label>
                  <p v-if="selectedProvider === 'wpengine'" class="managed-host-help">
                    {{ $t('In your WP Engine dashboard, go to Sites > your site > Domains. Look for the domain ending in .wpengine.com (e.g. "mysite.wpengine.com"). Enter the name portion below.') }}
                  </p>
                  <div class="managed-host-save-row">
                    <div class="managed-host-input-row">
                      <input
                        v-model="managedHostInput"
                        type="text"
                        class="managed-host-input"
                        :placeholder="managedHostPlaceholder"
                      />
                      <span v-if="managedHostSuffix" class="managed-host-suffix">{{ managedHostSuffix }}</span>
                    </div>
                    <button
                      class="btn btn-primary btn-small managed-host-save-btn"
                      @click="saveUpstreamOrigin"
                      :disabled="isSavingUpstream || !managedHostInput.trim()"
                    >
                      {{ isSavingUpstream ? $t('Saving...') : $t('Save') }}
                    </button>
                  </div>
                  <p v-if="currentUpstreamOrigin" class="managed-host-current">
                    {{ $t('Current upstream origin') }}: <code>{{ currentUpstreamOrigin }}</code>
                  </p>
                </div>

                <div class="dns-step-nav">
                  <button class="btn btn-primary" @click="goToStep(1)">&larr; {{ $t('Back') }}</button>
                  <button
                    class="btn btn-primary"
                    @click="onStep2Continue"
                    :disabled="isManagedHost && !currentUpstreamOrigin"
                  >
                    {{ $t('Continue') }} &rarr;
                  </button>
                </div>
              </div>

              <!-- Step 3: DNS Records & Verification -->
              <div v-else-if="dnsStep === 3" key="step3" class="dns-step-page">
                <!-- DNS Steps - adapted based on hosting provider -->
                <ol class="dns-steps">
                  <li class="dns-step">
                    <span class="step-number">1</span>
                    <span>{{ $t("Log in to your domain provider's DNS management panel") }}</span>
                  </li>
                  <template v-if="!isManagedHost">
                    <li class="dns-step">
                      <span class="step-number">2</span>
                      <span>{{ $t('Note your current @ record\'s value (it\'s usually a Type A or CNAME). Create a new record with the name "wl-origin", using the same type and value as your original @ record.') }}</span>
                    </li>
                    <li class="dns-step">
                      <span class="step-number">3</span>
                      <span>{{ $t('Delete your original @ record and re-create it as a CNAME record pointing to') }} <strong>proxy.weblinguist.ai</strong>.</span>
                    </li>
                    <li class="dns-step">
                      <span class="step-number">4</span>
                      <span>{{ $t('Wait for DNS changes to propagate, then you should be able to visit your website and see the changes. Try visiting yoursite.com/fr/ or yoursite.com/es-MX/') }}</span>
                    </li>
                  </template>
                  <template v-else>
                    <li class="dns-step">
                      <span class="step-number">2</span>
                      <span>{{ $t('Delete your original @ record and re-create it as a CNAME record pointing to') }} <strong>proxy.weblinguist.ai</strong>.</span>
                    </li>
                    <li class="dns-step">
                      <span class="step-number">3</span>
                      <span>{{ $t('Wait for DNS changes to propagate, then you should be able to visit your website and see the changes. Try visiting yoursite.com/fr/ or yoursite.com/es-MX/') }}</span>
                    </li>
                  </template>
                </ol>

                <!-- Origin health warning -->
                <div
                  v-if="hasDnsCheckData && originHealthMessage"
                  class="dns-check-results"
                >
                  <div class="dns-check-item failed">
                    <span class="check-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        ></path>
                      </svg>
                    </span>
                    <p>{{ originHealthMessage }}</p>
                  </div>
                </div>

                <!-- DNS records table -->
                <div class="dns-table-container">
                  <div class="dns-table-header">
                    <span class="dns-table-title">{{ $t('DNS Records') }}</span>
                    <button
                      class="btn btn-small dns-recheck-btn"
                      @click="verifyDns"
                      :disabled="isVerifying"
                    >
                      <svg
                        v-if="isVerifying"
                        class="spinner"
                        viewBox="0 0 50 50"
                        style="width: 0.875rem; height: 0.875rem; margin-right: 0.35rem"
                      >
                        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                      </svg>
                      {{ isVerifying ? $t('Checking...') : $t('Re-check') }}
                    </button>
                  </div>
                  <table class="dns-table">
                    <thead>
                      <tr>
                        <th>{{ $t('Type') }}</th>
                        <th>{{ $t('Name') }}</th>
                        <th>{{ $t('Value') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- Main domain (@) record -->
                      <tr>
                        <td>A/CNAME</td>
                        <td>
                          <div class="dns-value-wrapper">
                            <code class="dns-value">{{ dnsRecord1.name }}</code>
                          </div>
                        </td>
                        <td>
                          <div class="dns-value-wrapper">
                            <code class="dns-value">{{
                              dnsCheckData?.checks?.main_domain?.actual?.[0] || 'proxy.weblinguist.ai'
                            }}</code>
                          </div>
                        </td>
                      </tr>
                      <tr
                        v-if="mainDomainCheck.status !== 'unknown'"
                        class="dns-check-message-row"
                        :class="mainDomainCheck.status"
                      >
                        <td colspan="3">
                          <div class="dns-check-item" :class="mainDomainCheck.status">
                            <span class="check-icon">
                              <svg
                                v-if="mainDomainCheck.status === 'correct'"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                              <svg
                                v-else
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M6 18L18 6M6 6l12 12"
                                ></path>
                              </svg>
                            </span>
                            <p v-html="mainDomainCheck.message"></p>
                          </div>
                        </td>
                      </tr>

                      <!-- wl-origin / upstream record (only for VPS) -->
                      <template v-if="!isManagedHost">
                        <tr>
                          <td>{{ $t('CNAME') }}</td>
                          <td>
                            <div class="dns-value-wrapper">
                              <code class="dns-value">{{ dnsRecord2.name }}</code>
                            </div>
                          </td>
                          <td>
                            <div class="dns-value-wrapper">
                              <code class="dns-value"
                                >{ original A or CNAME value}</code
                              >
                            </div>
                          </td>
                        </tr>
                        <tr
                          v-if="mainDomainCheck.status !== 'unknown'"
                          class="dns-check-message-row"
                          :class="originCheck.status"
                        >
                          <td colspan="3">
                            <div class="dns-check-item" :class="originCheck.status">
                              <span class="check-icon">
                                <svg
                                  v-if="originCheck.status === 'correct'"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                  ></path>
                                </svg>
                                <svg
                                  v-else
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  ></path>
                                </svg>
                              </span>
                              <p>{{ originCheck.message }}</p>
                            </div>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>

                <div class="dns-step-nav">
                  <button class="btn btn-primary" @click="goToStep(2)">&larr; {{ $t('Back') }}</button>
                </div>
              </div>

            </Transition>
          </div>

          <!-- Step indicator — bottom right -->
          <div class="dns-step-indicator">
            <span class="step-label">{{ $t('Step') }} {{ dnsStep }} {{ $t('of') }} 3</span>
            <span
              v-for="s in 3"
              :key="s"
              :class="['step-dot', { active: s === dnsStep, completed: s < dnsStep }]"
              @click="s < dnsStep ? goToStep(s) : null"
            ></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue"
import { useLicenseStore } from "../../stores/license"
import { useThemeStore } from "../../stores/theme"
import SlideInNotification from "../SlideInNotification.vue"

const props = defineProps({
  license: {
    type: Object,
    required: true,
  },
  is_dns_restricted: {
    type: Boolean,
    default: true,
  },
})

const licenseStore = useLicenseStore()
const themeStore = useThemeStore()

const mode = ref("script")
const copiedScript = ref(false)
const installationScript = ref("")

const successMessage = ref("")
const failMessage = ref("")
const showSuccessNotification = ref(false)
const showFailNotification = ref(false)

// Hosting provider state
const selectedProvider = ref("standard")
const managedHostInput = ref("")
const isSavingUpstream = ref(false)

// Stepped flow state
const dnsStep = ref(1)
const transitionDirection = ref("forward")

const transitionName = computed(() =>
  transitionDirection.value === "forward" ? "slide-left" : "slide-right"
)

const goToStep = (step) => {
  transitionDirection.value = step > dnsStep.value ? "forward" : "backward"
  dnsStep.value = step
}

const currentUpstreamOrigin = computed(() => props.license?.upstream_origin || null)

const isManagedHost = computed(() => selectedProvider.value !== "standard")

const managedHostLabel = computed(() => {
  const labels = {
    wpengine: "WP Engine Install Name",
    kinsta: "Kinsta Site Name",
    flywheel: "Flywheel Site Name",
    other_managed: "Backend Hostname",
  }
  return labels[selectedProvider.value] || "Backend Hostname"
})

const managedHostPlaceholder = computed(() => {
  const placeholders = {
    wpengine: "mysite",
    kinsta: "mysite",
    flywheel: "mysite",
    other_managed: "mysite.hostingprovider.com",
  }
  return placeholders[selectedProvider.value] || "mysite.example.com"
})

const managedHostSuffix = computed(() => {
  const suffixes = {
    wpengine: ".wpengine.com",
    kinsta: ".kinsta.cloud",
    flywheel: ".flywheelsites.com",
    other_managed: null,
  }
  return suffixes[selectedProvider.value] || null
})

const onProviderChange = () => {
  managedHostInput.value = ""
}

const saveUpstreamOrigin = async () => {
  if (!props.license?.id || !managedHostInput.value.trim()) return

  isSavingUpstream.value = true
  try {
    let upstreamOrigin = managedHostInput.value.trim().toLowerCase()
    if (managedHostSuffix.value) {
      upstreamOrigin = upstreamOrigin + managedHostSuffix.value
    }

    await licenseStore.updateLicenseSettings({
      license_id: props.license.id,
      settings: props.license.settings || {},
      upstream_origin: upstreamOrigin,
    })

    successMessage.value = `Upstream origin set to ${upstreamOrigin}`
    showSuccessNotification.value = true
    setTimeout(() => (showSuccessNotification.value = false), 3000)
  } catch (error) {
    console.error("Failed to save upstream origin:", error)
    failMessage.value =
      error.response?.data?.error || "Failed to save upstream origin."
    showFailNotification.value = true
    setTimeout(() => (showFailNotification.value = false), 3000)
  } finally {
    isSavingUpstream.value = false
  }
}

const isEmbedded = computed(() => themeStore.isEmbedded)
const isShopifyPlatform = computed(() => window.WebLinguistDashboard?.platform === 'shopify')

const verificationStatusText = computed(() => {
  if (licenseStore.verificationStatus === "verified") return "Connected"
  if (licenseStore.verificationStatus === "failed") return "Not Connected"
  if (licenseStore.verificationStatus === "verifying") return "Verifying..."
  return "Unverified"
})

const verificationStatusClass = computed(() => {
  if (licenseStore.verificationStatus === "verified") return "verified"
  if (licenseStore.verificationStatus === "failed") return "failed"
  return "unverified"
})

const isDnsEnabled = computed(() => {
  // Use the persisted dns_enabled boolean, fall back to status-based check
  if (dnsCheckData.value?.dns_enabled !== undefined) {
    return !!dnsCheckData.value.dns_enabled
  }
  // Also check the license prop directly for initial load before store is populated
  if (props.license?.dns_check?.dns_enabled !== undefined) {
    return !!props.license.dns_check.dns_enabled
  }
  return !showStartButton.value
})

const isDnsEnabledAndUnverified = computed(
  () => isDnsEnabled.value && licenseStore.verificationStatus !== "verified"
)

const dnsCheckData = computed(() => licenseStore.state.dnsCheckData)

const hasDnsCheckData = computed(() =>
  dnsCheckData.value &&
  dnsCheckData.value.status &&
  dnsCheckData.value.status != "undefined" &&
  dnsCheckData.value.status !== "not_started_configuring"
)

const mainDomainCheck = computed(() => {
  const check = dnsCheckData.value?.checks?.main_domain
  if (!check)
    return { status: "unknown", message: "A record status is unavailable." }

  const isCorrect = check.actual?.includes(check.expected)
  const expectedDisplay = isManagedHost.value ? "proxy.weblinguist.ai" : check.expected
  const actual = check.actual?.join(", ") || "nothing"
  return {
    status: isCorrect ? "correct" : "failed",
    message: isCorrect
      ? `A record for ${check.name} is pointing correctly.`
      : `A record for ${check.name} is incorrect. <strong>Expected ${expectedDisplay} but found ${actual}.</strong>`,
  }
})

const originCheck = computed(() => {
  const check = dnsCheckData.value?.checks?.origin
  if (!check)
    return {
      status: "unknown",
      message: currentUpstreamOrigin.value
        ? "Upstream origin status is unavailable."
        : "wl-origin record status is unavailable.",
    }

  return {
    status: check.status === "correct" ? "correct" : "failed",
    message:
      check.status === "correct"
        ? currentUpstreamOrigin.value
          ? `Upstream origin ${check.name} is configured correctly.`
          : `wl-origin record for ${check.name} is correct.`
        : currentUpstreamOrigin.value
          ? `Upstream origin ${check.name} is not configured correctly.`
          : `wl-origin record for ${check.name} is not configured correctly.`,
  }
})

const originHealthMessage = computed(
  () => dnsCheckData.value?.origin_health?.message || null
)

const dnsRecord1 = computed(() => ({
  name: "@",
}))

const dnsRecord2 = computed(() => ({
  name: currentUpstreamOrigin.value || "wl-origin",
}))

const showStartButton = computed(() => {
  return (
    !dnsCheckData.value ||
    !dnsCheckData.value.status ||
    dnsCheckData.value.status == "undefined" ||
    dnsCheckData.value.status === "not_started_configuring"
  )
})

// Determine initial step based on persisted state
const initialDnsStep = computed(() => {
  if (!isDnsEnabled.value) return 1

  // DNS enabled — check if hosting provider is set
  const storedProvider = dnsCheckData.value?.hosting_provider
  if (storedProvider || currentUpstreamOrigin.value) return 3

  // Enabled but no provider chosen yet
  return 2
})

// Sync step from persisted state (only on data load, not user navigation)
const hasInitialized = ref(false)
watch(initialDnsStep, (newStep) => {
  if (!hasInitialized.value) {
    dnsStep.value = newStep
    hasInitialized.value = true
  }
}, { immediate: true })

// Also re-initialize when dnsCheckData loads after mount
watch(dnsCheckData, () => {
  if (!hasInitialized.value || dnsStep.value === 1) {
    dnsStep.value = initialDnsStep.value
    hasInitialized.value = true
  }
})

watch(
  () => props.license,
  async (newLicense) => {
    if (newLicense) {
      installationScript.value = await licenseStore.generateInstallationScript(
        newLicense
      )
    }
  },
  { immediate: true, deep: true }
)

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error("Failed to copy:", err)
    const textArea = document.createElement("textarea")
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
  }
}

const copyInstallationScript = async () => {
  if (!props.license) return
  copiedScript.value = true
  await copyToClipboard(installationScript.value)
  setTimeout(() => {
    copiedScript.value = false
  }, 2000)
}

const isVerifying = computed(
  () =>
    licenseStore.state.loading.dns ||
    licenseStore.verificationStatus === "verifying"
)

const syncDnsEnabledToWordPress = (enabled) => {
  if (isEmbedded.value && props.license) {
    licenseStore.saveLicenseToWordPress({
      license_id: props.license.id,
      license_key: props.license.license_key,
      subscription_id: props.license.subscription_id,
      dns_enabled: enabled,
    }).catch((err) => {
      console.error("Failed to sync dns_enabled to WordPress:", err)
    })
  }
}

const toggleDnsConfiguration = async () => {
  try {
    if (props.license?.id) {
      if (!isDnsEnabled.value) {
        await licenseStore.startDnsConfiguration({
          license_id: props.license.id,
        })
        successMessage.value = "Manual DNS setup enabled."
        showSuccessNotification.value = true
        setTimeout(() => (showSuccessNotification.value = false), 3000)
        syncDnsEnabledToWordPress(true)
        goToStep(2)
      } else {
        await licenseStore.stopDnsConfiguration({
          license_id: props.license.id,
        })
        successMessage.value = "Manual DNS setup disabled."
        showSuccessNotification.value = true
        setTimeout(() => (showSuccessNotification.value = false), 3000)
        syncDnsEnabledToWordPress(false)
        goToStep(1)
      }
    }
  } catch (error) {
    console.error("Failed to toggle DNS configuration:", error)
    failMessage.value =
      error.response?.data?.error?.message ||
      "Failed to update DNS configuration."
    showFailNotification.value = true
    setTimeout(() => {
      showFailNotification.value = false
    }, 3000)
  }
}

const onStep2Continue = async () => {
  if (props.license?.id) {
    // Persist provider choice
    await licenseStore.startDnsConfiguration({
      license_id: props.license.id,
      hosting_provider: selectedProvider.value,
    })
  }
  goToStep(3)
  // Trigger DNS checks when landing on step 3
  if (props.license?.id) {
    licenseStore.performDnsChecks(props.license.id, {
      skipOriginDetection: isManagedHost.value,
    })
  }
}

const verifyDns = async () => {
  try {
    if (props.license?.id) {
      await licenseStore.performDnsChecks(props.license.id, {
        skipOriginDetection: isManagedHost.value,
      })
      successMessage.value = "DNS records have been re-verified."
      showSuccessNotification.value = true
      setTimeout(() => {
        showSuccessNotification.value = false
      }, 3000)
    }
  } catch (error) {
    console.error("DNS verification failed:", error)
    failMessage.value =
      error.response?.data?.error?.message || "DNS verification failed."
    showFailNotification.value = true
    setTimeout(() => {
      showFailNotification.value = false
    }, 3000)
  }
}

// Initialize provider selector when license data becomes available
const initProviderFromUpstreamOrigin = (origin) => {
  if (!origin) {
    // Check if there's a stored provider choice in dnsCheckData
    const storedProvider = dnsCheckData.value?.hosting_provider
    if (storedProvider) {
      selectedProvider.value = storedProvider
    } else {
      selectedProvider.value = 'standard'
    }
    managedHostInput.value = ''
    return
  }
  if (origin.endsWith('.wpengine.com')) {
    selectedProvider.value = 'wpengine'
    managedHostInput.value = origin.replace('.wpengine.com', '')
  } else if (origin.endsWith('.kinsta.cloud')) {
    selectedProvider.value = 'kinsta'
    managedHostInput.value = origin.replace('.kinsta.cloud', '')
  } else if (origin.endsWith('.flywheelsites.com')) {
    selectedProvider.value = 'flywheel'
    managedHostInput.value = origin.replace('.flywheelsites.com', '')
  } else {
    selectedProvider.value = 'other_managed'
    managedHostInput.value = origin
  }
}

watch(
  () => props.license?.upstream_origin,
  (newOrigin) => {
    initProviderFromUpstreamOrigin(newOrigin)
  },
  { immediate: true }
)

onMounted(() => {
  // Seed store's dnsCheckData from the license prop so state is available immediately
  if (props.license?.dns_check) {
    licenseStore.state.dnsCheckData = {
      ...licenseStore.state.dnsCheckData,
      ...props.license.dns_check,
    }
  }

  // Default to DNS tab if DNS is enabled
  if (props.license?.dns_check?.dns_enabled) {
    mode.value = 'dns'
  }

  if (
    props.license?.id &&
    props.license?.dns_check?.status &&
    props.license?.dns_check?.status != "undefined" &&
    props.license?.dns_check?.status !== "not_started_configuring"
  ) {
    licenseStore.performDnsChecks(props.license.id, {
      skipOriginDetection: !!props.license.upstream_origin,
    })
  }
})
</script>

<style scoped>

.toggle-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.toggle-checkbox {
  display: none;
}

.toggle-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
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

.installation-card {
  position: relative;
  grid-column: span 2;
}

.installation-card-header,
.script-embed-header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.5rem;
  text-align: left;
}

.installation-mode-switcher {
  margin-top: 1.5rem;
  display: flex;
  background-color: var(--bg-hover);
  border-radius: 20px;
  padding: 0.25rem;
}

.mode-button {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  background-color: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 20px;
  transition: background-color 0.2s, color 0.2s;
  font-weight: 500;
}

.mode-button .dns-status-badge {
  margin-left: 0.5rem;
  font-size: 0.75rem;
}

.mode-button.active {
  background-color: white;
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dns-setup {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
}
.dns-setup-box {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: 12px;
}
.dns-record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.dns-record h4 {
  margin: 0;
  color: var(--text-primary);
}

.dns-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.dns-field label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.dns-value-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-hover);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.dns-value {
  font-family: monospace;
  word-break: break-all;
}
.btn-icon {
  width: 1rem;
  height: 1rem;
}

.dns-table .btn-small {
  padding: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.dns-table-container {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.dns-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: var(--bg-hover);
  border-bottom: 1px solid var(--border-color);
}

.dns-table-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.dns-recheck-btn {
  font-size: 0.8rem;
}

.dns-table {
  width: 100%;
  border-collapse: collapse;
}

.dns-table th,
.dns-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
}

.dns-table th {
  background-color: var(--bg-hover);
  color: var(--text-secondary);
  font-weight: 500;
}

.dns-table td {
  color: var(--text-primary);
  vertical-align: middle;
}

.dns-table tbody tr:last-child td {
  border-bottom: none;
}

.dns-table td .dns-value-wrapper {
  background: transparent;
  padding: 0;
}

.btn-success {
  background: #22c55e !important;
  color: white !important;
  border-color: #22c55e !important;
}
.premium-badge {
  margin-left: 1rem;
}
.manual-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}
.status-indicator.unverified {
  background-color: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}
.status-indicator.verified {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}
.status-indicator.failed {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.status-indicator.enabled-badge {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}
.enabled-badge-asterisk {
  color: #ef4444;
  font-size: 18px;
}
.installation-info {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
}

.installation-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.installation-script {
  text-align: left;
  font-family: monospace;
  background: var(--bg-hover);
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  border: 1px solid var(--border-color);
  margin: 0;
  max-height: 250px;
}
.hosting-provider-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
}

.hosting-provider-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.hosting-provider-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
}

.hosting-provider-select.full-width {
  width: 100%;
  max-width: 100%;
  text-align: left;
}

.managed-host-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-hover);
  border-radius: 8px;
  text-align: left;
}

.managed-host-help {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
}

.managed-host-save-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.managed-host-input-row {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  min-width: 0;
}

.managed-host-save-btn {
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .managed-host-save-row {
    flex-direction: column;
  }

  .managed-host-input-row {
    width: 100%;
  }

  .managed-host-save-btn {
    width: 100%;
  }
}

.managed-host-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px 0 0 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: monospace;
}

.managed-host-input-row .managed-host-input:only-child {
  border-radius: 8px;
}

.managed-host-suffix {
  padding: 0.5rem 0.75rem;
  background: var(--border-color);
  border: 1px solid var(--border-color);
  border-left: none;
  border-radius: 0 8px 8px 0;
  font-size: 0.85rem;
  font-family: monospace;
  color: var(--text-secondary);
  white-space: nowrap;
}

.managed-host-current {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

.managed-host-current code {
  background: var(--bg-primary);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.dns-steps {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dns-step {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--bg-hover);
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.dns-check-results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.dns-check-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: left;
}

.dns-check-item.correct {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.dns-check-item.failed {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.check-icon {
  display: inline-flex;
  width: 1.25rem;
  height: 1.25rem;
}

.spinner {
  animation: rotate 2s linear infinite;
  display: inline-block;
}

.path {
  stroke: currentColor;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

.embedded-installation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(
    249,
    250,
    251,
    0.95
  );
  backdrop-filter: blur(4px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  border-radius: 12px;
}

.overlay-content {
  max-width: 350px;
}

.overlay-icon {
  width: 48px;
  height: 48px;
  color: #22c55e;
  margin-bottom: 1rem;
}

.overlay-content h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.overlay-content p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* Step indicator — bottom right */
.dns-step-indicator {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0 0;
}

.step-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-right: 0.25rem;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-color);
  transition: background 0.3s ease, transform 0.3s ease;
}

.step-dot.active {
  background: var(--accent-color, #f205cb);
  transform: scale(1.3);
}

.step-dot.completed {
  background: #22c55e;
  cursor: pointer;
}

/* Step container and pages */
.dns-step-container {
  position: relative;
  overflow: hidden;
}

.dns-step-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Slide-left transition (forward: enter from right) */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-left-enter-from {
  transform: translateX(30%);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-30%);
  opacity: 0;
}

/* Slide-right transition (backward: enter from left) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-right-enter-from {
  transform: translateX(-30%);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(30%);
  opacity: 0;
}

/* Step navigation */
.dns-step-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}


/* DNS intro section (Step 1) */
.dns-intro {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
}

.dns-intro-notice {
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  margin: 0;
  line-height: 1.5;
}

</style>
