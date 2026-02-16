<template>
  <div class="walkthrough-container">
    <div class="walkthrough-sidebar">
      <div class="steps-list-container">
        <h1>Start Translating in Minutes</h1>
        <div class="horizontal-scroll-helper">
          <!-- Dynamic steps from notifications -->
          <ul v-if="mode === 'notifications'">
            <li
              :class="[
                { 'completed-step': step.viewed || (isSecondStep(step) && isDrawerOpen) },
                { 'current-step': current_step && step.id === current_step.id },
              ]"
              v-for="step in stepsToDisplay"
              :key="step.id"
            >
              <span class="completed-indicator">
                <span v-if="step.viewed || (isSecondStep(step) && isDrawerOpen) " style="width: 36px; height: 36px">
                  <CheckCircleIcon fill-color="white" size="36" />
                </span>
              </span>
              {{ callParseNotification(step, "title") }}
            </li>
          </ul>
          <!-- Static steps for registration-like flows -->
          <ul v-if="mode === 'static'">
            <li
              v-for="(step, index) in staticSteps"
              :key="index"
              :class="[
                { 'completed-step': index < localCurrentStaticStepIndex },
                { 'current-step': index === localCurrentStaticStepIndex },
              ]"
            >
              <span class="completed-indicator">
                <span
                  v-if="index < localCurrentStaticStepIndex"
                  style="width: 36px; height: 36px"
                >
                  <CheckCircleIcon fill-color="white" size="36" />
                </span>
              </span>
              {{ step }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    <p class="assurance-msg">Easy Setup · Cancel Anytime</p>
  </div>
</template>

<script>
import { ref, computed, watchEffect, watch } from "vue"
import { useAccountStore } from "../../../stores/account"
import { useCheckoutStore } from "../../../stores/checkout"
import { parseNotification } from "../../../../parseNotification"
import CheckCircleIcon from "vue-material-design-icons/CheckCircle.vue"

export default {
  name: "WalkthroughContainer",
  props: {
    mode: {
      type: String,
      default: "notifications", // 'notifications' or 'static'
    },
    staticSteps: {
      type: Array,
      default: () => [],
    },
    currentStaticStepIndex: {
      type: Number,
      default: 0,
    },
  },
  components: {
    CheckCircleIcon,
  },
  setup(props) {
    const current_step = ref(null)
    const accountStore = useAccountStore()
    const checkoutStore = useCheckoutStore()

    //computed
    const stepsToDisplay = computed(
      () => accountStore.state.initial_onboard_steps,
    )

    const isDrawerOpen = computed(() => {
      return checkoutStore.state.checkout_drawer_open
    })

    const localCurrentStaticStepIndex = computed(() => {
      if (
        props.mode === "static" &&
        props.currentStaticStepIndex === 1 &&
        isDrawerOpen.value
      ) {
        return 2
      }
      return props.currentStaticStepIndex
    })

    //watchers
    watchEffect(() => {
      // Only run this watcher for notification mode
      if (props.mode === "notifications" && stepsToDisplay.value) {
        getFirstUnviewedStep()
      }
    })

    watch(isDrawerOpen, (newValue) => {
      const stepsArray = stepsToDisplay.value
      const secondStep = stepsArray[1] || null
      const thirdStep = stepsArray[2] || null
      if (isDrawerOpen.value) {
        current_step.value = thirdStep
      } else {
        current_step.value = secondStep
      }
    })

    //methods
    function callParseNotification(notification, type = null) {
      // This function is only for notification mode
      return parseNotification(notification, type)
    }

    function getFirstUnviewedStep() {
      // This function is only for notification mode
      if (props.mode !== "notifications" || !stepsToDisplay.value) return

      const firstUnviewedStep =
        stepsToDisplay.value.find((step) => !step.viewed) || null

      if (firstUnviewedStep) {
        current_step.value = firstUnviewedStep
      }
    }

    function isSecondStep(step) {
      const title = callParseNotification(step, 'title') || null
      return title === 'Choose Your Site & Language'
    } 

    return {
      stepsToDisplay,
      current_step,
      localCurrentStaticStepIndex,
      isDrawerOpen,
      //methods
      callParseNotification,
      isSecondStep,
      //components
      CheckCircleIcon,
    }
  },
}
</script>
<style scoped>
.walkthrough-container {
  width: 100%;
  min-height: 100vh;
  background-color: transparent;
  background-image: linear-gradient(184deg, #05c7f2 0%, #054ef2 100% 100%);
  box-shadow: 0px 0px 80px #929292;
  position: relative;
}
.walkthrough-sidebar {
  color: white;
  display: flex;
  justify-content: center;
  padding-top: 20vh;
  text-align: left;
}
p.assurance-msg {
  position: absolute;
  margin: 0;
  bottom: 15px;
  left: 15%;
  color: white;
}
.steps-list-container {
  width: 75%;
}
.steps-list-container h1 {
  color: white;
  margin-bottom: 100px;
  font-size: 28px;
  font-weight: bold;
}
.steps-list-container ul {
  list-style: none;
  padding: 0;
  font-size: 24px;
}
.steps-list-container ul li {
  margin: 50px 0;
  display: flex;
  align-items: center;
  opacity: 0.75;
}
.steps-list-container ul li span.completed-indicator {
  box-sizing: content-box;
}
.steps-list-container ul li.current-step {
  opacity: 1;
}
.steps-list-container ul li.completed-step {
  opacity: 1;
  text-decoration: line-through;
}
.steps-list-container ul li span.completed-indicator {
  display: inline-flex;
  width: 30px;
  min-width: 30px;
  max-width: 30px;
  height: 30px;
  min-height: 30px;
  max-height: 30px;
  border-radius: 50%;
  border: 3px solid white;
  margin-right: 20px;
  align-items: center;
  justify-content: center;
}

.current-step {
  opacity: 1;
  transform-origin: center center;
  will-change: transform;
  backface-visibility: hidden;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.05);
    transform: scale(1);
  }
  50% {
    text-shadow:
      0 0 20px rgba(255, 255, 255, 0.8),
      0 0 30px rgba(255, 255, 255, 0.75);
    transform: scale(1.05);
  }
}

@media screen and (max-width: 769px) {
  .walkthrough-container {
    display: none;
    min-height: auto;
    padding-top: 65px;
    margin-bottom: 45px;
  }
  .walkthrough-sidebar {
    display: block;
    padding-top: 0;
  }
  .steps-list-container {
    width: 100%;
    overflow: hidden;
    position: relative;
  }
  h1 {
    margin: 15px 0 !important;
    padding: 20px;
    font-size: 24px !important;
    font-weight: bolder;
  }
  .horizontal-scroll-helper {
    overflow-x: scroll;
    scrollbar-width: thin;
  }
  .horizontal-scroll-helper ul {
    font-size: 14px;
    width: max-content;
    padding: 15px 45px 15px 15px;
    display: inline-flex;
  }
  .horizontal-scroll-helper li {
    display: inline-flex !important;
    margin: 0 15px !important;
    font-size: 16px;
  }
  .horizontal-scroll-helper li span.completed-indicator {
    width: 20px !important;
    height: 20px !important;
    border-width: 2px !important;
    margin-right: 10px;
  }
  .form-container {
    margin-top: 25%;
  }
}
</style>
