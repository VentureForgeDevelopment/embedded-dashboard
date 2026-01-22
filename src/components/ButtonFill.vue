<template>
  <div class="fill-button-container">
    <button
      class="btn btn-outline fill-btn"
      :class="{ filled: isFilled }"
      @click.stop="handleClick"
    >
      {{ isFilled ? filledText : nullText }}
    </button>
    <transition name="fade">
      <span v-if="isFilled && helperText" class="filled-helper-text">
        {{ helperText }}
      </span>
    </transition>
  </div>
</template>

<script setup>
import { ref } from "vue"

const props = defineProps({
  nullText: {
    type: String,
    default: "Copy",
  },
  filledText: {
    type: String,
    default: "Copied!",
  },
  helperText: {
    type: String,
    default: "",
  },
  revert: {
    type: Boolean,
    default: true,
  },
  revertDelay: {
    type: Number,
    default: 1500,
  },
})

const emit = defineEmits(["click"])

const isFilled = ref(false)

const handleClick = (event) => {
  if (isFilled.value) return // Prevent multiple clicks while in filled state
  event.stopPropagation()

  emit("click", (success) => {
    // The callback allows the parent to control if the state should change
    if (success !== false) {
      isFilled.value = true

      if (props.revert) {
        setTimeout(() => {
          isFilled.value = false
        }, props.revertDelay)
      }
    }
  })
}
</script>

<style scoped>
.fill-button-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.fill-btn {
  transition: all 0.3s ease;
  min-width: 80px;
}

.fill-btn.filled {
  background: #22c55e !important;
  color: white !important;
  border-color: #22c55e !important;
  transform: scale(1.05);
}

.filled-helper-text {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #22c55e;
  font-weight: 500;
  white-space: nowrap;
  margin-top: 0.25rem;
  pointer-events: none;
}

/* These styles are copied from WebsitesView.vue for the transition */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
