<template>
  <div class="account-setup-wrapper">
    <WalkthroughContainer
      v-if="isEmbedded"
      mode="static"
      :static-steps="['Sign Up', 'Setup Your Plan', 'Translate Your Website']"
      :current-static-step-index="currentOnboardStepIndex"
    />
    <WalkthroughContainer v-else />
    <div class="account-setup-content padding">
      <SlideInNotification
        :show="copiedScript"
        message="Installation script copied to clipboard"
        type="success"
      />
      <div>
        <ul class="onboard-steps-list">
          <li
            v-for="step in initialOnboardSteps"
            :key="step.id"
            @click.stop="expandStep(step)"
            :class="[
              'section-container',
              { 'step-completed': step.viewed },
              {
                'section-container-collapsed':
                  !step_expanded || step_expanded.id !== step.id,
              },
            ]"
          >
            <div class="step-header">
              <span class="notification-title">
                {{ callParseNotification(step, "title") }}
              </span>
              <span class="completed-indicator">
                <span v-if="step.viewed" style="width: 30px; height: 30px">
                  <CheckCircleIcon fill-color="#27ae60" size="30" />
                </span>
              </span>
            </div>
            <div class="section-content">
              <div class="step-body">
                {{ callParseNotification(step, "body") }}
              </div>
              <div
                v-if="
                  callParseNotification(step, 'title') ==
                  'Install Your Translator'
                "
              >
                <div @click="copyInstallationScript" class="embed-code">
                  Click to Copy
                  <pre class="installation-script">{{
                    firstLicenseEmbedScript
                  }}</pre>
                </div>
              </div>
              <div
                v-if="callParseNotification(step, 'action_html') !== ''"
                v-html="callParseNotification(step, 'action_html')"
                class="step-action-html"
              ></div>

              <div class="action-btn-wrapper">
                <button
                  v-if="callParseNotification(step, 'action_slug') !== null"
                  @click="doAction(callParseNotification(step, 'action_slug'))"
                  class="btn btn-primary"
                >
                  More Info
                </button>
                <!-- remove this button for second 'select a plan' step -->
                <button
                  v-if="
                    step.id !== initialOnboardSteps[1].id && step.viewed === 0
                  "
                  class="mark-as-completed btn btn-primary"
                  @click="markAsCompleted(step)"
                >
                  Mark as Completed
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watchEffect } from "vue"
import { useAuthStore } from "../stores/auth"
import { useAccountStore } from "../stores/account"
import { useLicenseStore } from "../stores/license"
import { useRouter } from "vue-router"
import WalkthroughContainer from "../components/Checkout/partials/WalkthroughContainer.vue"
import { parseNotification } from "../../parseNotification"
import Swal from "sweetalert2"
import CheckCircleIcon from "vue-material-design-icons/CheckCircle.vue"
import SlideInNotification from "../components/SlideInNotification.vue"
import { useThemeStore } from "../stores/theme"

export default {
  name: "AccountSetup",
  components: {
    WalkthroughContainer,
    CheckCircleIcon,
    SlideInNotification,
  },
  setup() {
    const accountStore = useAccountStore()
    const authStore = useAuthStore()
    const licenseStore = useLicenseStore()
    const router = useRouter()
    const themeStore = useThemeStore()

    const step_expanded = ref(null)
    const firstLicenseEmbedScript = ref(null)
    const copiedScript = ref(false)

    const isEmbedded = computed(() => themeStore.isEmbedded)

    const initialOnboardSteps = computed(() => {
      const steps = accountStore.state.initial_onboard_steps
      if (isEmbedded.value && steps && steps.length > 0) {
        // Create a deep copy to avoid modifying the store's original state directly
        const modifiedSteps = JSON.parse(JSON.stringify(steps))
        const lastStepIndex = modifiedSteps.length - 1
        if (lastStepIndex >= 0) {
          const lastStep = modifiedSteps[lastStepIndex]
          const notificationData = JSON.parse(lastStep.data)
          notificationData.title = "Translate Your Website" // Overwrite the title
          lastStep.data = JSON.stringify(notificationData)
        }
        return modifiedSteps
      }
      return steps
    })

    const currentOnboardStepIndex = computed(() => {
      // The static steps are 0-indexed: 0:Sign Up, 1:Setup Plan, 2:Translate Website.
      // This view is for step 2, but we need to check if step 1 is complete.
      if (initialOnboardSteps.value && initialOnboardSteps.value.length > 1) {
        const setupPlanStep = initialOnboardSteps.value[1] // 'Setup Your Plan' step
        if (setupPlanStep && !setupPlanStep.viewed) {
          // If plan setup isn't done, we're on step 1.
          return 1
        }
      }
      // Otherwise, we're on the final step.
      return 2
    })

    const firstLicense = computed(() => {
      const licenses = licenseStore.state.licenses
      if (Array.isArray(licenses) && licenses.length > 0) {
        return licenses[0]
      }
      return null
    })

    const callParseNotification = (notification, type = null) => {
      return parseNotification(notification, type)
    }

    const expandStep = (step) => {
      step_expanded.value = step
    }

    const triggerCompletionSuccess = () => {
      const successText = isEmbedded.value
        ? "You're all set! You can now manage your website's translation settings from this dashboard."
        : "You have successfully completed the account setup process."

      Swal.fire({
        title: "Congratulations!",
        text: successText,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      })

      setTimeout(() => {
        router.push({
          path: "/websites",
        })
      }, 2000)
    }

    const getFirstUnviewedStep = () => {
      const firstUnviewedStep =
        initialOnboardSteps.value.find((step) => !step.viewed) || null

      if (firstUnviewedStep) {
        expandStep(firstUnviewedStep)
      }
      return firstUnviewedStep
    }

    const markAsCompleted = (step) => {
      accountStore
        .markNotificationAsViewed({
          notification_id: step.id,
        })
        .then(() => {
          return accountStore
            .getNotifications({
              account_id: authStore.currentAccountId,
            })
            .then(() => {
              let firstUnviewedStep = getFirstUnviewedStep()
              if (firstUnviewedStep == null) {
                triggerCompletionSuccess()
              }
            })
        })
    }

    const doAction = (action_slug) => {
      if (action_slug.startsWith("/")) {
        router.push({ path: action_slug })
      } else {
        window.open(action_slug, "_blank", "noopener,noreferrer")
      }
    }

    // Copy installation script to clipboard
    const copyInstallationScript = async () => {
      if (!firstLicense.value) return

      copiedScript.value = true

      try {
        await navigator.clipboard.writeText(firstLicenseEmbedScript.value)
        console.log("Installation script copied to clipboard")
      } catch (err) {
        console.error("Failed to copy installation script:", err)
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = firstLicenseEmbedScript.value
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }

      // Reset copied state after 2 seconds
      setTimeout(() => {
        copiedScript.value = false
      }, 2000)
    }

    watchEffect(() => {
      if (initialOnboardSteps.value && initialOnboardSteps.value.length > 0) {
        getFirstUnviewedStep()
      }
    })

    watchEffect(async () => {
      if (!licenseStore.state.licenses) {
        licenseStore.getLicenses()
      } else if (firstLicense.value) {
        firstLicenseEmbedScript.value =
          await licenseStore.generateInstallationScript(firstLicense.value)
      }
    })

    onMounted(() => {
      licenseStore.getLicenses()
    })

    return {
      step_expanded,
      initialOnboardSteps,
      callParseNotification,
      expandStep,
      markAsCompleted,
      doAction,
      firstLicense,
      firstLicenseEmbedScript,
      copiedScript,
      copyInstallationScript,
      isEmbedded,
      currentOnboardStepIndex,
      //components
      WalkthroughContainer,
      CheckCircleIcon,
      SlideInNotification,
    }
  },
}
</script>
<style>
.account-setup-wrapper {
  display: grid;
  grid-template-columns: 35% 65%;
  background: #eee;
}
.account-setup-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.onboard-steps-list {
  list-style: none;
}
.onboard-steps-list li {
  margin: 15px 0 !important;
  text-align: left;
}
.onboard-steps-list li.step-completed {
  text-decoration: line-through;
  opacity: 0.5;
  pointer-events: none;
}
.onboard-steps-list li .step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 20px;
}
.onboard-steps-list li .step-header .notification-title {
  font-weight: bold;
  font-size: 24px;
  transition: 0.2s all ease-in-out;
}

.onboard-steps-list li.step-completed .step-header .notification-title {
  font-size: 16px;
}
.onboard-steps-list li .step-header .completed-indicator {
  border: 1px solid #ddd;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.current-step-container p {
  font-weight: bold;
}
.onboard-steps-list li .step-body {
  margin-bottom: 20px;
  max-height: 250px;
  overflow: auto;
}
.onboard-steps-list li .embed-code {
  max-height: 250px;
  overflow: auto;
}
div.action-btn-wrapper {
  display: flex;
  justify-content: space-evenly;
  margin: 1rem 0;
}
.installation-script {
  cursor: pointer;
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
}
@media screen and (max-width: 769px) {
  .account-setup-wrapper {
    display: block;
  }
  .account-setup-content {
    padding-top: 45px;
    align-items: flex-start;
  }
}
</style>
