<template>
  <div class="success-container">
    <div class="success-card">
      <div class="confetti-wrapper">
        <ConfettiExplosion
          :colors="[
            '#F205CB',
            '#7C05F2',
            '#229E70',
            'rgba(5, 78, 242, 1)',
            'rgba(5, 199, 242, 1)',
            '#B7C11E',
          ]"
          :particleCount="165"
          :particleSize="5"
          :force="0.3"
          :duration="2500"
          :stageHeight="400"
          :stageWidth="350"
          :shouldDestroyAfterDone="true"
        />
      </div>
      <h1 class="title">{{ copy.title }}</h1>
      <p class="subtitle">{{ copy.subtitle }}</p>
      <p class="description">{{ copy.description }}</p>
      <button class="btn btn-primary action-button" @click="pushToNextPage">
        {{ copy.buttonText }}
      </button>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from "vue"
import ConfettiExplosion from "vue-confetti-explosion"
import { useRouter } from "vue-router"
import { useThemeStore } from "../stores/theme"
import { useLicenseStore } from "../stores/license"

export default {
  name: "SuccessConfirmation",
  props: {
    type: {
      type: String,
      default: null,
    },
  },
  components: {
    ConfettiExplosion,
  },
  setup(props) {
    const router = useRouter()
    const themeStore = useThemeStore()
    const licenseStore = useLicenseStore()

    const isEmbedded = computed(() => {
      return themeStore.isEmbedded
    })

    const activeLicense = computed(() => {
      return licenseStore.state.active_license
    })

    const copy = computed(() => {
      switch (props.type) {
        case "purchase":
          return {
            title: "Purchase Successful!",
            subtitle: "Your new website is ready to go global.",
            description:
              "You can now find your new license in the websites section and begin the installation.",
            buttonText: "View My Websites",
          }
        case "free-tier":
          return {
            title: "Welcome to WebLinguist!",
            subtitle: "Your free license is ready.",
            description:
              "You can now translate up to 10,000 words per month. Find your license in the websites section to begin installation.",
            buttonText: "View My Websites",
          }
        case "upgrade":
          return {
            title: "Successfully Upgraded!",
            subtitle: "Your plan has been upgraded.",
            description:
              "You now have access to more features. Enjoy the new benefits!",
            buttonText: "View My Websites",
          }
        case "downgrade":
          return {
            title: "Plan Change Confirmed",
            subtitle: "Your subscription has been scheduled for a downgrade.",
            description:
              "The changes will take effect at the end of your current billing period.",
            buttonText: "View My Subscriptions",
          }
        case "downgrade-to-free":
          return {
            title: "Plan Change Confirmed",
            subtitle: "Your subscription will be cancelled.",
            description:
              "You will be downgraded to our Free plan at the end of your current billing period. You will still have access to your license and can manage it from the websites page.",
            buttonText: "View My Subscriptions",
          }
        default: // 'initial-purchase' and fallback
          return {
            title: "Welcome to WebLinguist!",
            subtitle: "We've sent an email with your temporary password.",
            description:
              "You're one step closer to making your site multilingual. Complete the final steps to connect with a global audience.",
            buttonText: "Finish Account Setup",
          }
      }
    })

    const pushToNextPage = () => {
      if (isEmbedded.value) {
        activeLicense.value
          ? router.push(`/websites/${activeLicense.value.id}`)
          : router.push("/welcome")
      } else {
        if (
          props.type === "purchase" ||
          props.type === "free-tier" ||
          props.type === "upgrade"
        ) {
          router.push("/websites")
        } else if (
          props.type === "downgrade" ||
          props.type === "downgrade-to-free"
        ) {
          router.push("/subscriptions")
        } else {
          router.push("/account-setup")
        }
      }
    }

    onMounted(() => {
      //get licenses again here to ensure we're able to retrieve an active license 
      licenseStore.getLicenses()
    })

    return {
      pushToNextPage,
      copy,
    }
  },
}
</script>
<style scoped>
.success-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
  padding: 2rem;
}

.success-card {
  position: relative;
  background: var(--bg-secondary, #fff);
  padding: 3rem 4rem;
  border-radius: 12px;
  box-shadow: var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.1));
  max-width: 600px;
  width: 100%;
  animation: fadeInScale 0.5s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.confetti-wrapper {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary, #111);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary, #555);
  margin-bottom: 1.5rem;
}

.description {
  color: var(--text-secondary, #555);
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.action-button {
  padding: 0.8rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
}
</style>
