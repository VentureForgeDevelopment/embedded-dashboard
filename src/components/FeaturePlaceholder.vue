<template>
  <div class="feature-placeholder-content">
    <div class="feature-placeholder-wrapper">
      <div class="feature-placeholder-text">
        <h3 class="feature-placeholder-title">{{ title }}</h3>
        <p class="feature-placeholder-description">{{ description }}</p>
        <div class="feature-list">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="feature-item"
          >
            <span class="feature-icon">✓</span>
            <span>{{ feature }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  features: {
    type: Array,
    required: true,
    default: () => [],
  },
})
</script>

<style scoped>
/* Feature Placeholder Section */
.feature-placeholder-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.feature-placeholder-wrapper {
  padding: 2.5rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #fef5ff 100%);
  border-radius: 16px;
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
  transition: all 0.3s ease;
}

.feature-placeholder-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 16px;
  padding: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.3;
}

.feature-placeholder-wrapper:hover {
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.18);
  transform: translateY(-2px);
}

.feature-placeholder-text {
  text-align: left;
}

.feature-placeholder-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  margin-top: 0;
}

.feature-placeholder-description {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.125rem;
  background: white;
  border-radius: 10px;
  border: 1px solid rgba(102, 126, 234, 0.15);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.06);
  transition: all 0.2s ease;
}

.feature-item:hover {
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.12);
  transform: translateX(4px);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .feature-placeholder-wrapper {
    padding: 1.5rem;
  }

  .feature-placeholder-text {
    text-align: left;
  }
}
</style>
