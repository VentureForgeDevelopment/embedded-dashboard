<template>
  <div class="link-generator-container">
    <h3 class="section-subtitle">Your Referral Link</h3>
    <p class="section-description">
      Share this unique link with friends and colleagues to start earning.
    </p>
    <div class="link-box">
      <input
        type="text"
        :value="referralLink"
        readonly
        @mousedown.prevent
        class="link-input"
      />
      <button @click="copyToClipboard" class="copy-button">
        {{ copyButtonText }}
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref } from "vue"
import { useAuthStore } from "../../stores/auth"
import { config } from "../../config/environment.js"
import AlertCircleOutline from "vue-material-design-icons/AlertCircleOutline.vue"

export default {
  name: "LinkGenerator",
  props: {},
  components: {
    AlertCircleOutline,
  },
  setup() {
    const authStore = useAuthStore()
    const marketingHomepageUrl = computed(() => config.marketingHomepageUrl)

    const copyButtonText = ref("Copy")

    const user = computed(() => authStore.user)

    const referralLink = computed(() => {
      if (user.value && user.value.id) {
        return `${marketingHomepageUrl.value}?ref=${user.value.id}`
      }
      return "Generating link..."
    })

    const copyToClipboard = async () => {
      if (!navigator.clipboard) {
        // Fallback for older browsers
        copyButtonText.value = "Copy failed"
        return
      }
      try {
        await navigator.clipboard.writeText(referralLink.value)
        copyButtonText.value = "Copied!"
        setTimeout(() => {
          copyButtonText.value = "Copy"
        }, 2000) // Reset button text after 2 seconds
      } catch (err) {
        console.error("Failed to copy: ", err)
        copyButtonText.value = "Failed"
      }
    }

    return {
      user,
      referralLink,
      copyToClipboard,
      copyButtonText,
      //components
      AlertCircleOutline,
    }
  },
}
</script>

<style scoped>
.link-generator-container {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  text-align: left;
}
.section-subtitle {
  margin-top: 0;
}
.section-description {
  color: var(--text-secondary);
}
.link-box {
  display: flex;
  margin: 20px 0;
}
.link-input {
  flex-grow: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
  background-color: #ffffff;
  cursor: default;
}
.copy-button {
  padding: 8px 16px;
  background-color: var(--accent-color);
  color: white;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  white-space: nowrap;
}
.copy-button:hover {
  background-color: var(--highlight-color);
}
</style>
