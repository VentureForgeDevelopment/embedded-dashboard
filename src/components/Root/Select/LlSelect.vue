<template>
  <!-- Non-multiple select (dropdown) -->
  <div v-if="!multiple" class="select-wrapper" ref="selectWrapperEl">
    <label :for="id" class="visually-hidden">{{ label }}</label> 
    <button
      :id="id"
      ref="triggerEl"
      class="select-trigger"
      :class="{ 'select-trigger-multiple': multiple }"
      @click="toggleDropdown"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
    >
      <span v-if="!multiple && !modelValue" class="placeholder">{{
        placeholder
      }}</span>
      <span v-else-if="!multiple && modelValue">{{ selectedOptionText }}</span>
    </button>
    <div
      v-show="isOpen"
      class="options-container"
      :class="{ 'options-container-multiple': multiple }"
    >
      <ul
        ref="optionsEl"
        :id="listboxId"
        role="listbox"
        :aria-multiselectable="multiple"
        tabindex="-1"
      >
        <li
          v-for="(option, index) in options"
          :key="option.props.key"
          :role="'option'"
          :class="{
            'is-selected': isSelected(option.props.value),
            'option-disabled': option.props.disabled,
          }"
          :aria-selected="isSelected(option.props.value)"
          :aria-disabled="option.props.disabled"
          @click="() => handleOptionClick(option)"
          class="option"
        >
          <component :is="() => option.children.default()" />
        </li>
      </ul>
    </div>
  </div>

  <!-- Multiple select (always open list) -->
  <div v-else class="select-wrapper">
    <label :for="id" class="visually-hidden">{{ label }}</label>
    <ul
      :id="id"
      ref="optionsEl"
      role="listbox"
      :aria-multiselectable="multiple"
      class="options-list-multiple"
    >
      <li
        v-for="option in options"
        :key="option.props.key"
        role="option"
        :class="{
          'is-selected': isSelected(option.props.value),
          'option-disabled': option.props.disabled,
        }"
        :aria-selected="isSelected(option.props.value)"
        :aria-disabled="option.props.disabled"
        @click="() => handleOptionClick(option)"
        class="option"
      >
        <template v-for="child in option.children">
          <component :is="child" />
        </template>
      </li>
    </ul>
  </div>
</template>

<script>
import {
  ref,
  onMounted,
  onUpdated,
  computed,
  watch,
  onBeforeUnmount,
} from "vue"
export default {
  name: "LlSelect",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, Number, Array],
      default: null,
    },
    placeholder: {
      type: String,
      default: "Select an option",
    },
    autoUpdate: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit, slots, attrs }) {
    const selectWrapperEl = ref(null)
    const triggerEl = ref(null)
    const optionsEl = ref(null)
    const isOpen = ref(false)

    const listboxId = computed(() => `${props.id}-listbox`)

    const options = computed(() => {
      // By calling slots.default() inside the computed property,
      // we make it reactive to changes in the slot content.
      const slotNodes = slots.default ? slots.default() : []

      // When v-for is used on the root element in a slot, Vue wraps it in a Fragment.
      // We need to look inside the fragment's children for the actual option nodes.
      if (slotNodes.length === 1 && typeof slotNodes[0].type === "symbol") {
        // This is likely a fragment, so we take its children
        return (slotNodes[0].children || []).filter(v => v.type === 'option')
      }
      return slotNodes.filter(vnode => vnode.type === 'option')
    })

    const selectedOptionText = computed(() => {
      const selected = options.value.find(
        (opt) =>
          JSON.stringify(opt.props.value) === JSON.stringify(props.modelValue)
      );
      return selected ? selected.children.default()[0].children.trim() : "";
    })

    const isSelected = (optionValue) => {
      if (props.multiple) {
        return (
          Array.isArray(props.modelValue) &&
          props.modelValue.some((v) => v.code === optionValue.code)
        )
      }
      return JSON.stringify(props.modelValue) === JSON.stringify(optionValue)
    }

    const toggleDropdown = () => {
      isOpen.value = !isOpen.value
    }

    const closeDropdown = () => {
      isOpen.value = false
    }

    const handleOptionClick = (option) => {
      if (option.props.disabled) return

      const clickedValue = option.props.value

      if (props.multiple) {
        const currentValue = Array.isArray(props.modelValue)
          ? [...props.modelValue]
          : []
        const index = currentValue.findIndex(
          (v) => v.code === clickedValue.code
        )

        if (index > -1) {
          currentValue.splice(index, 1)
        } else {
          currentValue.push(clickedValue)
        }
        emit("update:modelValue", currentValue)
      } else {
        emit("update:modelValue", clickedValue)
        closeDropdown()
      }
    }

    const handleClickOutside = (event) => {
      if (
        selectWrapperEl.value &&
        !selectWrapperEl.value.contains(event.target)
      ) {
        closeDropdown()
      }
    }

    onMounted(() => {
      document.addEventListener("click", handleClickOutside)
    })

    onBeforeUnmount(() => {
      document.removeEventListener("click", handleClickOutside)
    })

    watch(isOpen, (open) => {
      if (open && !props.multiple) {
        // Focus the options container to allow keyboard navigation
        optionsEl.value?.focus()
      }
    })

    // --- Logic for autoUpdate ---
    const previousOptionKeys = ref([])

    const getOptionKeys = () => {
      if (!slots.default) {
        return []
      }
      return options.value
        .map((vnode) => vnode.props.key)
        .filter((key) => key !== null && key !== undefined)
    }

    onMounted(() => {
      if (props.autoUpdate) {
        emit("update:modelValue", props.multiple ? [] : "")
      }
      previousOptionKeys.value = getOptionKeys()
    })

    onUpdated(() => {
      if (props.autoUpdate) {
        const currentOptionKeys = getOptionKeys()
        if (
          JSON.stringify(currentOptionKeys) !==
          JSON.stringify(previousOptionKeys.value)
        ) {
          emit("update:modelValue", props.multiple ? [] : "")
          previousOptionKeys.value = currentOptionKeys
        }
      }
    })

    return {
      selectWrapperEl,
      triggerEl,
      optionsEl,
      isOpen,
      options,
      listboxId,
      selectedOptionText,
      toggleDropdown,
      handleOptionClick,
      isSelected,
    }
  },
}
</script>

<style scoped>
.select-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.select-trigger {
  position: relative;
  width: 100%;
  text-align: left;
  padding: 10px;
  border: 1px solid black;
  border-radius: 4px;
  line-height: 1.5;
  height: auto;
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  cursor: pointer;
}

.options-list-multiple {
  height: 225px;
  overflow-y: auto;
  width: 100%;
  border: 1px solid black;
  border-radius: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.options-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid rgb(216, 220, 229);
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.options-container ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.option {
  padding: 20px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.option.is-selected {
  /* This will be overridden by :deep selector in parent, but good as a fallback */
  background-color: #e0e0e0;
}

.option.option-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.select-trigger:hover, .options-list-multiple:hover {
  border-color: #66b1ff;
}

.option:not(.option-disabled):hover, .option:hover {
  cursor: pointer;
  background-color: var(--light-accent-color) !important;
}
.option.option-disabled:hover {
  background-color: var(--bg-secondary) !important;
  cursor: not-allowed;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.placeholder {
  color: #888;
}
</style>
