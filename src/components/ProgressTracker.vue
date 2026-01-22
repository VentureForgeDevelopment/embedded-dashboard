<template>
  <div class="progress-tracker-container">
    <h3 class="section-subtitle">Agency Progress Tracker</h3>
    <p class="section-description">
      This is a progress tracker for your agency. It will help you keep track of
      your progress and see how far you have come. Click the steps to check them off your list.
    </p>
    <div class="progress-container">
      <div class="progress-bar-container">
        <div
          class="progress-bar"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <span class="progress-text"
        >{{ Math.round(progressPercentage) }}% Complete</span
      >
    </div>
    <ul class="progress-tracker-steps-list">
      <li v-for="(step, index) in agencyProgressTrackerSteps" :key="index">
        <div
          @click="step.viewed === 0 ? markAsCompleted(step) : null"
          class="step-header"
        >
          <span class="completed-indicator">
            <span v-if="step.viewed" style="width: 30px; height: 30px">
              <CheckCircleIcon fill-color="#27ae60" size="30" />
            </span>
          </span>

          {{ callParseNotification(step, "title") }}
        </div>
      </li>
    </ul>

    <p v-if="getFirstUnviewedStep() === null">
      <span style="font-size:2rem">
        🎉
      </span>
      Congratulations! You're earning recurring revenue! Keep it up!
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { parseNotification } from "../../parseNotification"
import { useAccountStore } from "../stores/account"
import { useAuthStore } from "../stores/auth"
import Swal from "sweetalert2"
import { useRouter } from "vue-router"
import CheckCircleIcon from "vue-material-design-icons/CheckCircle.vue"

const accountStore = useAccountStore()
const authStore = useAuthStore()
const router = useRouter()

const agencyProgressTrackerSteps = computed(() => {
  return accountStore.state.agency_progress_tracker_steps
})

const getFirstUnviewedStep = () => {
  const firstUnviewedStep =
    agencyProgressTrackerSteps.value.find((step) => !step.viewed) || null

  return firstUnviewedStep
}

const callParseNotification = (notification, type = null) => {
  return parseNotification(notification, type)
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

const triggerCompletionSuccess = () => {
  Swal.fire({
    title: "Congratulations!",
    text: "You have unlocked your multilingual recurring revenue stream. Keep it up!",
    icon: "success",
    timer: 2000,
    showConfirmButton: false,
  })
}

const progressPercentage = computed(() => {
  const steps = agencyProgressTrackerSteps.value
  if (!steps || steps.length === 0) {
    return 0
  }
  const completedSteps = steps.filter((step) => step.viewed).length
  return (completedSteps / steps.length) * 100
})
</script>

<style scoped>
.progress-tracker-container {
  padding: 1rem 2rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  text-align: left;
  background: #fff;
}
.section-subtitle {
  margin-top: 0;
}
.section-description {
  color: var(--text-secondary);
}
ul.progress-tracker-steps-list {
  list-style: none;
  padding: 0;
}
ul.progress-tracker-steps-list li .step-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
  margin-bottom: 10px;
  cursor: pointer;
  width:fit-content;
}

li .completed-indicator {
  border: 1px solid #ddd;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.progress-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.progress-bar-container {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 5px;
  height: 20px;
  margin-right: 10px;
}

.progress-bar {
  height: 100%;
  background-color: #27ae60;
  border-radius: 5px;
  transition: width 0.5s ease-in-out;
}

.progress-text {
  font-weight: bold;
}
</style>
