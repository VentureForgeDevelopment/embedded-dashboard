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
      <h3 class="card-title">Installation Setup</h3>
      <p class="installation-description">
        Choose your preferred installation method to activate your license
      </p>
    </div>
    <div class="installation-mode-switcher">
      <button
        @click="mode = 'script'"
        :class="{ active: mode === 'script' }"
        class="mode-button"
      >
        Script
      </button>
      <button
        @click="mode = 'dns'"
        :class="[
          'mode-button',
          { active: mode === 'dns' },
          { 'btn-disabled': is_free },
        ]"
      >
        DNS
        <span
          v-if="isDnsEnabled"
          style="margin-left: 0.5rem"
          class="status-indicator enabled-badge"
        >
          Enabled
          <span v-if="isDnsEnabledAndUnverified" class="enabled-badge-asterisk"
            >*</span
          >
        </span>
        <span v-if="is_free" class="premium-badge">Premium</span>
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
            <h4>Installation Handled Automatically</h4>
            <p>
              Because you are using the WebLinguist WordPress plugin, your
              installation script is automatically embedded into your site.
            </p>
          </div>
        </div>
        <div class="card-header">
          <div class="script-embed-header">
            <h4 class="card-title">Script</h4>
            <p class="installation-description">
              Copy and paste this script into your browser console on any
              website:
            </p>
          </div>
        </div>
        <button
          class="btn btn-small"
          :class="{ 'btn-success': copiedScript }"
          @click="copyInstallationScript"
          :disabled="isEmbedded"
        >
          {{ copiedScript ? "Copied!" : "Copy" }}
        </button>

        <pre class="installation-script">{{ installationScript }}</pre>
      </div>

      <!-- DNS Setup -->
      <div v-if="mode === 'dns'" class="dns-setup">
        <div class="dns-setup-box">
          <div class="card-header">
            <div class="script-embed-header">
              <h4 class="card-title">Manual DNS</h4>
              <p class="installation-description">
                Add these DNS records manually in your domain provider
              </p>
            </div>
            <div class="manual-status">
              <span v-if="isDnsEnabled" class="status-indicator enabled-badge"
                >Enabled</span
              >
              <span class="status-indicator" :class="verificationStatusClass">{{
                verificationStatusText
              }}</span>
            </div>
          </div>
          <ol class="dns-steps">
            <li class="dns-step">
              <span class="step-number">1</span>
              <span>Log in to your domain provider's DNS management panel</span>
            </li>
            <li class="dns-step">
              <span class="step-number">2</span>
              <span
                >Note your current @ record's value (it's usually a Type A or
                CNAME). Create a new record with the name "wl-origin", using the
                same type and value as your original @ record.</span
              >
            </li>
            <li class="dns-step">
              <span class="step-number">3</span>
              <span
                >Delete your original @ record and re-create it as a CNAME
                record pointing to <strong>proxy.weblinguist.ai</strong>.</span
              >
            </li>
            <li class="dns-step">
              <span class="step-number">4</span>
              <span
                >Wait for DNS changes to propagate, then you should be able to
                visit your website and see the changes. Try visiting
                yoursite.com/fr/ or yoursite.com/es-MX/</span
              >
            </li>
          </ol>

          <div class="toggle-group">
            <label class="toggle-label" @click.stop>
              <input
                type="checkbox"
                class="toggle-checkbox"
                :checked="!showStartButton"
                @change="toggleDnsConfiguration"
                :disabled="isVerifying"
              />
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-text">{{
              showStartButton
                ? "Enable Manual DNS Setup"
                : "Manual DNS Setup Enabled"
            }}</span>
          </div>

          <div
            v-if="
              dnsCheckData &&
              dnsCheckData.status &&
              dnsCheckData.status != 'undefined' &&
              dnsCheckData.status !== 'not_started_configuring'
            "
            class="dns-check-results"
          >
            <div v-if="originHealthMessage" class="dns-check-item failed">
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

          <div
            class="dns-table-container"
            v-if="
              dnsCheckData &&
              dnsCheckData.status &&
              dnsCheckData.status != 'undefined' &&
              dnsCheckData.status !== 'not_started_configuring'
            "
          >
            <table class="dns-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
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
                        dnsCheckData?.checks?.main_domain?.actual[0]
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
                      <p>{{ mainDomainCheck.message }}</p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>CNAME</td>
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
                  :class="mainDomainCheck.status"
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
              </tbody>
            </table>
          </div>

          <div class="dns-actions">
            <button
              v-if="!showStartButton"
              class="btn btn-primary"
              @click="verifyDns"
              :disabled="isVerifying"
            >
              <svg
                v-if="isVerifying"
                class="spinner"
                viewBox="0 0 50 50"
                style="width: 1rem; height: 1rem; margin-right: 0.5rem"
              >
                <circle
                  class="path"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke-width="5"
                ></circle>
              </svg>
              {{ isVerifying ? "Verifying..." : "Verify DNS Records" }}
            </button>
          </div>
        </div>

        <!-- dns provider integration -->
        <!-- <div class="dns-setup-box">
          <div class="card-header">
            <div class="script-embed-header">
              <h4 class="card-title">Cloudflare Integration</h4>
              <p class="installation-description">
                Automatically configure DNS via Cloudflare Api
              </p>
            </div>
            <div class="manual-status">
              <span class="status-indicator" :class="verificationStatusClass">{{
                verificationStatusText
              }}</span>
            </div>
          </div>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue"
// import { storeToRefs } from "pinia"
import { useLicenseStore } from "../../stores/license"
import { useThemeStore } from "../../stores/theme"
import SlideInNotification from "../SlideInNotification.vue"

const props = defineProps({
  license: {
    type: Object,
    required: true,
  },
  is_free: {
    type: Boolean,
    default: false,
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

const isEmbedded = computed(() => themeStore.isEmbedded)

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

const isDnsEnabled = computed(() => !showStartButton.value)

const isDnsEnabledAndUnverified = computed(
  () => isDnsEnabled.value && licenseStore.verificationStatus !== "verified"
)

const dnsCheckData = computed(() => licenseStore.state.dnsCheckData)

const mainDomainCheck = computed(() => {
  const check = dnsCheckData.value?.checks?.main_domain
  if (!check)
    return { status: "unknown", message: "A record status is unavailable." }

  const isCorrect = check.actual?.includes(check.expected)
  return {
    status: isCorrect ? "correct" : "failed",
    message: isCorrect
      ? `A record for ${check.name} is pointing correctly.`
      : `A record for ${check.name} is incorrect. Expected ${
          check.expected
        } but found ${check.actual?.join(", ") || "nothing"}.`,
  }
})

const originCheck = computed(() => {
  const check = dnsCheckData.value?.checks?.origin
  if (!check)
    return {
      status: "unknown",
      message: "wl-origin record status is unavailable.",
    }

  return {
    status: check.status === "correct" ? "correct" : "failed",
    message:
      check.status === "correct"
        ? `wl-origin record for ${check.name} is correct.`
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
  name: "wl-origin",
}))

const showStartButton = computed(() => {
  return (
    !dnsCheckData.value ||
    !dnsCheckData.value.status ||
    dnsCheckData.value.status == "undefined" ||
    dnsCheckData.value.status === "not_started_configuring"
  )
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
    // Fallback for older browsers
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

const toggleDnsConfiguration = async () => {
  try {
    if (props.license?.id) {
      if (showStartButton.value) {
        await licenseStore.startDnsConfiguration({
          license_id: props.license.id,
        })
        successMessage.value = "Manual DNS setup enabled."
        showSuccessNotification.value = true
        setTimeout(() => (showSuccessNotification.value = false), 3000)
      } else {
        await licenseStore.stopDnsConfiguration({
          license_id: props.license.id,
        })
        successMessage.value = "Manual DNS setup disabled."
        showSuccessNotification.value = true
        setTimeout(() => (showSuccessNotification.value = false), 3000)
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

const verifyDns = async () => {
  try {
    if (props.license?.id) {
      await licenseStore.performDnsChecks(props.license.id)
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

onMounted(() => {
  if (
    props.license?.id &&
    props.license?.dns_check?.status &&
    props.license?.dns_check?.status != "undefined" &&
    props.license?.dns_check?.status !== "not_started_configuring"
  ) {
    licenseStore.performDnsChecks(props.license.id)
  }
})
</script>

<style scoped>
.dns-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

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
.dns-steps {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
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
  ); /* A light background with backdrop blur */
  backdrop-filter: blur(4px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  border-radius: 12px; /* Match card border-radius */
}

.overlay-content {
  max-width: 350px;
}

.overlay-icon {
  width: 48px;
  height: 48px;
  color: #22c55e; /* Success green */
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
</style>
