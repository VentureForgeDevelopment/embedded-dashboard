<template>
   <div class="analytics-page">
    <div class="coming-soon-overlay">
      <div class="coming-soon-content">
        <h2>Advanced Analytics Coming Soon!</h2>
        <p>
          We're building a powerful analytics dashboard to give you detailed
          insights into your license usage.
        </p>
      </div>
    </div>

    <!-- Header -->
    <div class="header">
      <div class="header-title">
        <svg
          class="icon-large icon-blue"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20V16" />
        </svg>
        <h1>Analytics</h1>
      </div>
      <p class="header-subtitle">
        View usage statistics and user engagement for your license.
      </p>
    </div>

    <!-- Filters -->
    <div class="filters">
      <button
        v-for="period in timePeriods"
        :key="period.value"
        @click="activePeriod = period.value"
        :class="[
          'btn',
          'btn-small',
          activePeriod === period.value ? 'btn-primary' : 'btn-outline',
        ]"
      >
        {{ period.label }}
      </button>
    </div>

    <!-- Main Grid -->
    <div class="main-grid">
      <!-- Stat Cards -->
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="overview-card stat-card"
      >
        <div class="stat-header">
          <div class="stat-icon" v-html="stat.icon"></div>
          <h3 class="stat-label">{{ stat.label }}</h3>
        </div>
        <p class="stat-value">{{ stat.value.toLocaleString() }}</p>
        <p class="stat-change" :class="stat.changeType">
          {{ stat.change }}% vs. previous period
        </p>
      </div>

      <!-- Location Heatmap -->
      <!-- <div class="overview-card heatmap-card">
        <div class="card-header">
          <h2>Location Heatmap</h2>
        </div>
        <div class="card-body">
          <div class="heatmap-placeholder">
            <img
              src="https://i.imgur.com/gX11s2F.png"
              alt="World map with heatmap points"
            />
            <div class="heatmap-legend">
              <span>Low</span>
              <div class="gradient-bar"></div>
              <span>High</span>
            </div>
          </div>
        </div>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const activePeriod = ref("30d");

const timePeriods = [
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 60 Days", value: "60d" },
  { label: "Last 90 Days", value: "90d" },
];

const placeholderData = ref({
  "30d": {
    pageviews: 125430,
    visitors: 45890,
    translations: 89320,
    tts: 12500,
  },
  "60d": {
    pageviews: 260110,
    visitors: 92100,
    translations: 190450,
    tts: 26700,
  },
  "90d": {
    pageviews: 410500,
    visitors: 155600,
    translations: 310800,
    tts: 41200,
  },
});

const stats = computed(() => {
  const data = placeholderData.value[activePeriod.value];
  return [
    {
      label: "Total Pageviews",
      value: data.pageviews,
      change: 12.5,
      changeType: "increase",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"></path><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path></svg>`,
    },
    {
      label: "Unique Visitors",
      value: data.visitors,
      change: 8.2,
      changeType: "increase",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    },
    {
      label: "Translations Served",
      value: data.translations,
      change: 21.7,
      changeType: "increase",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg>`,
    },
    {
      label: "Text-to-Speech Usage",
      value: data.tts,
      change: -2.1,
      changeType: "decrease",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>`,
    },
  ];
});
</script>

<style scoped>
.analytics-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
  position: relative;
}

.coming-soon-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99;
  background: rgba(249, 250, 251, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.coming-soon-content {
  text-align: center;
  background: white;
  padding: 2rem 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.coming-soon-content h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

.coming-soon-content p {
  font-size: 1rem;
  color: #4b5563;
  margin-top: 0.5rem;
}

.header {
  margin-bottom: 32px;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.header-title h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}
.header-subtitle {
  font-size: 16px;
  color: #6b7280;
}
.icon-large {
  width: 32px;
  height: 32px;
}
.icon-blue {
  color: #2563eb;
}

.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.main-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.overview-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.stat-card {
  display: flex;
  flex-direction: column;
}
.stat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.stat-icon {
  color: #6b7280;
}
.stat-icon :deep(svg) {
  width: 24px;
  height: 24px;
}
.stat-label {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}
.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.stat-change {
  font-size: 14px;
  margin-top: 4px;
}
.stat-change.increase {
  color: #16a34a;
}
.stat-change.decrease {
  color: #dc2626;
}

.heatmap-card {
  grid-column: span 4;
}
.card-header {
  padding: 0;
  margin-bottom: 16px;
}
.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}
.card-body {
  padding: 0;
}
.heatmap-placeholder {
  position: relative;
  width: 100%;
  background-color: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
}
.heatmap-placeholder img {
  width: 100%;
  height: auto;
  opacity: 0.7;
}
.heatmap-legend {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #374151;
}
.gradient-bar {
  width: 100px;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(to right, #60a5fa, #facc15, #f87171);
}

@media (max-width: 1024px) {
  .main-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .heatmap-card {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  .heatmap-card {
    grid-column: span 1;
  }
}
</style>
