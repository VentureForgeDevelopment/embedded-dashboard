<script setup>
import { computed } from "vue"

const props = defineProps({
  percentage: { type: Number, default: 0 },
  pagesDiscovered: { type: Number, default: 0 },
  pagesTranslated: { type: Number, default: 0 },
  status: { type: String, default: "running" },
  compact: { type: Boolean, default: false },
})

const statusLabel = computed(() => {
  if (props.status === "pending") return "Starting pre-cache..."
  if (props.status === "completed") {
    if (props.pagesDiscovered > 0) return `Pre-cache complete: ${props.pagesTranslated} / ${props.pagesDiscovered} pages`
    return "Pre-cache complete"
  }
  if (props.pagesTranslated === 0) return "Discovering and translating pages..."
  if (props.pagesDiscovered > 0) return `Pre-caching translations: ${props.pagesTranslated} / ${props.pagesDiscovered} pages`
  return `Pre-caching translations: ${props.pagesTranslated} pages done`
})

const barWidth = computed(() => {
  if (props.status === "pending" || (props.pagesTranslated === 0 && props.percentage === 0)) return "5%"
  return `${Math.max(props.percentage, 2)}%`
})

const isIndeterminate = computed(() => {
  return props.status === "pending" || (props.pagesTranslated === 0 && props.pagesDiscovered === 0)
})
</script>

<template>
  <div class="precache-progress" :class="{ compact }">
    <div class="precache-progress-header">
      <span class="precache-label" :class="{ 'precache-label-complete': status === 'completed' }">
        <span v-if="status === 'completed'" class="precache-check">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </span>
        <span v-else class="precache-spinner"></span>
        {{ statusLabel }}
      </span>
      <span v-if="!isIndeterminate" class="precache-percent">{{ percentage }}%</span>
    </div>
    <div class="precache-bar-track">
      <div
        class="precache-bar-fill"
        :class="{ indeterminate: isIndeterminate, complete: status === 'completed' }"
        :style="{ width: barWidth }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.precache-progress {
  padding: 0.75rem 0;
}

.precache-progress.compact {
  padding: 0.5rem 0 0 0;
}

.precache-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
}

.precache-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.compact .precache-label {
  font-size: 0.7rem;
}

.precache-percent {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-color, #667eea);
}

.compact .precache-percent {
  font-size: 0.65rem;
}

.precache-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2.5px solid rgba(102, 126, 234, 0.25);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 6px;
}
.compact .precache-spinner {
  width: 10px;
  height: 10px;
  border-width: 1.5px;
  margin-right: 4px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.precache-check {
  display: inline-flex;
  align-items: center;
  color: #22c55e;
  vertical-align: middle;
  margin-right: 4px;
}
.precache-label-complete {
  color: #22c55e;
  font-weight: 600;
}

.precache-bar-track {
  width: 100%;
  height: 6px;
  background: #d1d5db;
  border-radius: 3px;
  overflow: hidden;
}

.compact .precache-bar-track {
  height: 4px;
}

.precache-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.6s ease;
}

.precache-bar-fill.complete {
  background: #22c55e;
  width: 100% !important;
}

.precache-bar-fill.indeterminate {
  animation: indeterminate 1.8s infinite ease-in-out;
  width: 30% !important;
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
</style>
