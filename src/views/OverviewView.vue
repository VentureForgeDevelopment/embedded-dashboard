<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { useAuthStore } from "../stores/auth"
import Notifications from "../components/Notifications/Notifications.vue"
import Plus from "vue-material-design-icons/Plus.vue"
import Earth from "vue-material-design-icons/Earth.vue"
import Pencil from "vue-material-design-icons/Pencil.vue"
import AccountGroup from "vue-material-design-icons/AccountGroup.vue"

const authStore = useAuthStore()

const greetings = [
  "Welcome back", // English
  "Bienvenue", // French
  "Bienvenido de nuevo", // Spanish
  "Willkommen zurück", // German
]

const currentGreeting = ref(greetings[0])
let greetingInterval = null

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
})

onUnmounted(() => {
  clearInterval(greetingInterval)
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
        Here's what's happening with your websites today.
      </p>
    </div>

    <!-- Statistics Grid -->
    <!-- <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card" :class="`stat-${stat.color}`">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div> -->

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Recent Activity -->
      <div class="content-card notifications-card">
        <h3 class="card-title">Notifications</h3>
        <Notifications :show_header="false" />
      </div>

      <!-- Quick Actions -->
      <div class="content-card">
        <h3 class="card-title">Quick Actions</h3>
        <div class="quick-actions">
          <router-link to="/checkout" class="action-button">
            <span class="action-icon">
              <Plus
                size="40"
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              />
            </span>
            <span>Add Website</span>
          </router-link>
          <router-link to="/websites" class="action-button">
            <span class="action-icon">
              <Earth
                size="38"
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              />
            </span>
            <span>Manage Translations</span>
          </router-link>
          <router-link to="/edit-account" class="action-button">
            <span class="action-icon">
              <Pencil
                size="38"
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              />
            </span>
            <span>Edit Account</span>
          </router-link>
          <router-link to="/manage-users" class="action-button">
            <span class="action-icon">
              <AccountGroup
                size="38"
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              />
            </span>
            <span>Manage Users</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
