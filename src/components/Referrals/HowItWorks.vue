<template>
  <div>
    <div class="how-it-works">
      <h3 class="section-subtitle">
        <AlertCircleOutline
          style="
            display: inline-flex;
            justify-content: center;
            align-items: center;
            margin-right: 0.5rem;
          "
        />
        How It Works
      </h3>
      <ol class="steps-list">
        <li>Share your unique referral link with potential customers</li>
        <li>
          When they sign up using your link, they'll be tracked as your referral
        </li>
        <li>
          Earn 30% commission on <em>each transaction</em> your referrals make
        </li>
        <li>Recieve payouts when you reach $100 in earnings</li>
      </ol>
    </div>
  </div>
</template>

<script>
import AlertCircleOutline from "vue-material-design-icons/AlertCircleOutline.vue"

export default {
  name: "HowItWorks",
  components: {
    AlertCircleOutline,
  },
  setup() {
    return {
      //components
      AlertCircleOutline,
    }
  },
}
</script>

<style scoped>
.how-it-works {
  padding: 1rem 2rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
}
.how-it-works .section-subtitle {
  font-size: 14px;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}
.how-it-works .steps-list {
  padding-top: 0.5rem;
  padding-left: 2rem;
  font-size: 14px;
  text-align: left;
}
.how-it-works .steps-list li {
  margin-bottom: 10px;
}
</style>
