<script setup>
import { computed } from "vue"
import { useRouter } from "vue-router"
import { usePreCacheStore } from "../stores/precache"
import { useLicenseStore } from "../stores/license"

const router = useRouter()
const preCacheStore = usePreCacheStore()
const licenseStore = useLicenseStore()

const activeCaches = computed(() => {
  return preCacheStore.activePreCaches.map((item) => {
    const license = (licenseStore.state.licenses || []).find(
      (l) => l.id === item.licenseId
    )
    return {
      ...item,
      domainName: license?.domain_name || `License #${item.licenseId}`,
    }
  })
})

const completedCaches = computed(() => {
  return preCacheStore.recentCompletions.map((item) => {
    const license = (licenseStore.state.licenses || []).find(
      (l) => l.id === item.licenseId
    )
    return {
      ...item,
      domainName: license?.domain_name || `License #${item.licenseId}`,
    }
  })
})

const hasToasts = computed(() => activeCaches.value.length > 0 || completedCaches.value.length > 0)

function dismiss(licenseId) {
  preCacheStore.dismissToast(licenseId)
}

function dismissCompletion(licenseId) {
  preCacheStore.dismissCompletion(licenseId)
}

function goToLicense(licenseId) {
  router.push({ name: "manage-license", params: { id: licenseId } })
}
</script>

<template>
  <Transition name="toast-slide">
    <div v-if="hasToasts" class="precache-toast-container">
      <!-- Active pre-cache toasts -->
      <div
        v-for="cache in activeCaches"
        :key="'active-' + cache.licenseId"
        class="precache-toast"
      >
        <div class="toast-content">
          <div class="toast-icon" @click="goToLicense(cache.licenseId)">
            <svg width="16" height="16" viewBox="0 -960 960 960" fill="currentColor">
              <path d="m476-80 182-480h84L924-80h-84l-43-122H603L560-80h-84ZM160-200l-56-56 202-202q-35-35-63.5-80T190-640h84q20 39 40 68t48 58q33-33 68.5-92.5T484-720H40v-80h280v-80h80v80h280v80H564q-21 72-63 148t-83 116l96 98-30 82-122-125-202 201Zm468-72h144l-72-204-72 204Z"/>
            </svg>
          </div>
          <div class="toast-text toast-link" @click="goToLicense(cache.licenseId)">
            <span class="toast-title">{{ cache.domainName }}</span>
            <span class="toast-status">
              <span class="toast-spinner"></span>
              <template v-if="cache.status === 'pending'">Starting pre-cache...</template>
              <template v-else-if="cache.pages_translated === 0">Discovering pages...</template>
              <template v-else-if="cache.pages_discovered > 0">{{ cache.pages_translated }}/{{ cache.pages_discovered }} pages &middot; {{ cache.percentage }}%</template>
              <template v-else>{{ cache.pages_translated }} pages done &middot; {{ cache.percentage }}%</template>
            </span>
            <div class="toast-bar-track">
              <div
                class="toast-bar-fill"
                :class="{ indeterminate: cache.status === 'pending' || cache.pages_discovered === 0 }"
                :style="{ width: `${Math.max(cache.percentage, 3)}%` }"
              ></div>
            </div>
          </div>
          <button class="toast-dismiss" @click.stop="dismiss(cache.licenseId)" title="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Completion toasts -->
      <div
        v-for="cache in completedCaches"
        :key="'done-' + cache.licenseId"
        class="precache-toast toast-complete"
      >
        <div class="toast-content">
          <div class="toast-icon toast-icon-complete" @click="goToLicense(cache.licenseId)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div class="toast-text toast-link" @click="goToLicense(cache.licenseId)">
            <span class="toast-title">{{ cache.domainName }}</span>
            <span class="toast-status toast-status-complete">Pre-cache complete &middot; {{ cache.pages_translated }} pages translated</span>
          </div>
          <button class="toast-dismiss" @click.stop="dismissCompletion(cache.licenseId)" title="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.precache-toast-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 320px;
}

.precache-toast {
  background: var(--bg-secondary, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  animation: toastIn 0.3s ease;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 0.875rem;
}

.toast-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.12));
  border-radius: 6px;
  color: #667eea;
  cursor: pointer;
}

.toast-link {
  cursor: pointer;
}

.toast-text {
  flex: 1;
  min-width: 0;
}

.toast-title {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-status {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.toast-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 1.5px solid rgba(102, 126, 234, 0.25);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 3px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.toast-bar-track {
  width: 100%;
  height: 3px;
  background: #d1d5db;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 6px;
}

.toast-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.6s ease;
}

.toast-bar-fill.indeterminate {
  animation: indeterminate 1.8s infinite ease-in-out;
  width: 30% !important;
}

/* Completion toast variant */
.toast-complete {
  border-color: rgba(34, 197, 94, 0.3);
}
.toast-icon-complete {
  background: rgba(34, 197, 94, 0.12) !important;
  color: #22c55e !important;
}
.toast-status-complete {
  color: #16a34a !important;
  font-weight: 500;
}

.toast-dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: var(--text-secondary);
  opacity: 0.5;
  transition: opacity 0.2s ease;
  line-height: 0;
}

.toast-dismiss:hover {
  opacity: 1;
}

/* Transitions */
.toast-slide-enter-active {
  transition: all 0.3s ease;
}
.toast-slide-leave-active {
  transition: all 0.2s ease;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(250%);
  }
  100% {
    transform: translateX(-100%);
  }
}

@media (max-width: 480px) {
  .precache-toast-container {
    left: 10px;
    right: 10px;
    max-width: none;
  }
}
</style>
