<template>
  <div class="stats-container">
    <!-- Pending Conversions -->
    <div class="stat-card">
      <div class="stat-icon-wrapper">
        <ClockTimeThreeOutline
          class="stat-icon"
          :size="24"
          fillColor="#4a69bb"
        />
      </div>
      <div class="stat-content">
        <span class="stat-value">{{ stats.pending_conversions }}</span>
        <span class="stat-label">Pending</span>
      </div>
    </div>

    <!-- Overall Conversions -->
    <div class="stat-card">
      <div class="stat-icon-wrapper">
        <CheckboxMarkedCircleOutline
          class="stat-icon"
          :size="24"
          fillColor="#4a69bb"
        />
      </div>
      <div class="stat-content">
        <span class="stat-value">{{ stats.overall_conversions }}</span>
        <span class="stat-label">Conversions</span>
      </div>
    </div>

    <!-- Conversion Rate -->
    <div class="stat-card">
      <div class="stat-icon-wrapper">
        <TrendingUp class="stat-icon" :size="24" fillColor="#4a69bb" />
      </div>
      <div class="stat-content">
        <span class="stat-value">{{ stats.conversion_rate }}%</span>
        <span class="stat-label">Conversion Rate</span>
      </div>
    </div>
  </div>
</template>

<script>
import ClockTimeThreeOutline from "vue-material-design-icons/ClockTimeThreeOutline.vue"
import CheckboxMarkedCircleOutline from "vue-material-design-icons/CheckboxMarkedCircleOutline.vue"
import TrendingUp from "vue-material-design-icons/TrendingUp.vue"

export default {
  name: 'Stats',
  components: {
    ClockTimeThreeOutline,
    CheckboxMarkedCircleOutline,
    TrendingUp,
  },
  props: {
    stats: {
      type: Object,
      required: true,
    },
  },
  setup(props) {},
}
</script>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  margin: 1rem;
}
.stat-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.stat-icon-wrapper {
  background-color: #f0f4ff;
  border-radius: 50%;
  padding: 12px;
  margin-right: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.stat-icon {
  width: 24px;
  height: 24px;
  color: #4a69bb;
}
.stat-content {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}
.stat-label {
  font-size: 14px;
  color: #666;
}
@media (max-width:768px) {
  .stats-container{
    display: block;
  }
  .stat-card{
    margin-bottom:30px;
  }
}
</style>
