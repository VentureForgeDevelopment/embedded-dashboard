<template>
  <div class="upgrade-prompt-overlay" :class="{ 'as-overlay': asOverlay }">
    <div class="upgrade-prompt-content">
      <div class="upgrade-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      </div>
      <h3 class="upgrade-title">{{ title || 'Upgrade to Unlock' }}</h3>
      <p class="upgrade-description">{{ description || 'This feature requires a paid subscription.' }}</p>

      <div v-if="features && features.length" class="feature-list">
        <div v-for="(feature, index) in features" :key="index" class="feature-item">
          <span class="feature-check">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          <span>{{ feature }}</span>
        </div>
      </div>

      <div class="upgrade-actions">
        <button @click="navigateToUpgrade" class="btn btn-primary upgrade-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          {{ buttonText || 'Upgrade Now' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: 'Upgrade to Unlock'
  },
  description: {
    type: String,
    default: 'This premium feature requires a paid subscription.'
  },
  features: {
    type: Array,
    default: () => []
  },
  buttonText: {
    type: String,
    default: 'Upgrade Now'
  },
  upgradeUrl: {
    type: String,
    default: null
  },
  upgradeRoute: {
    type: Object,
    default: null
  },
  asOverlay: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

function navigateToUpgrade() {
  if (props.upgradeRoute) {
    router.push(props.upgradeRoute)
  } else if (props.upgradeUrl) {
    router.push(props.upgradeUrl)
  } else {
    router.push({ name: 'checkout' })
  }
}
</script>

<style scoped>
.upgrade-prompt-overlay {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.upgrade-prompt-overlay.as-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(249, 250, 251, 0.85);
  backdrop-filter: blur(4px);
  z-index: 100;
}

.upgrade-prompt-overlay.as-overlay .upgrade-prompt-content {
  max-width: 500px;
}

.upgrade-prompt-content {
  padding: 2.5rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.upgrade-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.upgrade-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.upgrade-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
}

.upgrade-description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 0.95rem;
  color: #374151;
}

.feature-check {
  width: 22px;
  height: 22px;
  min-width: 22px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-check svg {
  width: 12px;
  height: 12px;
  color: white;
}

.upgrade-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.upgrade-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.upgrade-btn .btn-icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 640px) {
  .upgrade-prompt-content {
    padding: 1.5rem;
  }

  .upgrade-title {
    font-size: 1.5rem;
  }
}
</style>
