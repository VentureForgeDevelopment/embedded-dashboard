<template>
  <div class="manual-color-input-wrapper" @mousedown.stop>
    <!-- Solid Color Input -->
    <div v-if="!isGradient" class="form-group">
      <label for="manual-color-input" class="form-label"
        >Manual Color Entry</label
      >
      <div class="input-with-swatch">
        <span class="color-swatch-container">
          <span
            class="color-swatch"
            :style="{ background: swatchColor }"
          ></span>
        </span>
        <input
          @mousedown.stop
          @click.stop
          id="manual-color-input"
          type="text"
          class="form-input color-text-input"
          v-model="inputValue"
          @blur="updateColor"
          @keyup.enter="updateColor"
          placeholder="#Hex or rgba(...)"
        />
        <small v-if="errorMessage" class="form-help error-message">{{
          errorMessage
        }}</small>
      </div>
    </div>

    <!-- Gradient Stops Input -->
    <div v-else class="form-group">
      <label class="form-label">Gradient Stops</label>
      <div
        v-for="(stop, index) in gradientStops"
        :key="index"
        class="gradient-stop-row"
      >
        <div class="input-with-swatch has-action-button">
          <span class="color-swatch-container">
            <span class="color-swatch" :style="{ background: stop.css }"></span>
          </span>
          <input
            @mousedown.stop
            @click.stop
            :id="'gradient-stop-input-' + index"
            type="text"
            class="form-input color-text-input"
            v-model="stop.inputValue"
            @blur="updateGradientStop(index)"
            @keyup.enter="updateGradientStop(index)"
            placeholder="#RRGGBB or rgba(...)"
          />
          <button
            @click="removeGradientStop(index)"
            v-if="gradientStops.length > 2"
            class="action-button remove-stop-btn"
            title="Remove stop"
          >
            &times;
          </button>
        </div>
        <small v-if="stop.errorMessage" class="form-help error-message">{{
          stop.errorMessage
        }}</small>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed, nextTick } from "vue"

export default {
  name: "ManualColorInput",
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:modelValue", "manual-update"],
  setup(props, { emit, root }) {
    const inputValue = ref("")
    const errorMessage = ref("")
    const gradientStops = ref([])

    const isGradient = computed(() => {
      const mode = props.modelValue?.mode
      return mode === "linear" || mode === "radial"
    })

    const swatchColor = computed(() => {
      return (
        props.modelValue.css ||
        `rgba(${props.modelValue.color.r}, ${props.modelValue.color.g}, ${props.modelValue.color.b}, ${props.modelValue.color.a})`
      )
    })

    function colorObjectToCss(colorObj) {
      if (!colorObj) return ""
      // Check if the object has a color property with r, g, b
      if (colorObj.color && typeof colorObj.color.r !== "undefined") {
        const { r, g, b, a } = colorObj.color
        return `rgba(${r}, ${g}, ${b}, ${a})`
      }
      return colorObj.css || ""
    }

    watch(
      () => props.modelValue,
      (newValue) => {
        if (!newValue) return

        if (newValue.mode === "solid" || !isGradient.value) {
          inputValue.value = colorObjectToCss(newValue)
          gradientStops.value = []
        } else if (isGradient.value && newValue.gradients) {
          gradientStops.value = newValue.gradients.map((stop) => ({
            ...stop,
            inputValue: colorObjectToCss(stop),
            css: colorObjectToCss(stop),
            errorMessage: "",
          }))
          inputValue.value = ""
        }
        errorMessage.value = ""
      },
      { immediate: true, deep: true }
    )

    function regenerateGradientCss(colorObject) {
      const gradientParts = colorObject.gradients.map((g) => {
        const c = g.color
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a}) ${g.percent}%`
      })

      if (colorObject.mode === "linear") {
        colorObject.css = `background-image:linear-gradient(${
          colorObject.degree
        }deg,${gradientParts.join(",")})`
      } else if (colorObject.mode === "radial") {
        colorObject.css = `background-image:radial-gradient(circle,${gradientParts.join(
          ","
        )})`
      }
      return colorObject
    }

    function removeGradientStop(index) {
      if (props.modelValue.gradients.length <= 2) {
        return // Don't remove if only 2 stops are left
      }
      const newColorObject = JSON.parse(JSON.stringify(props.modelValue))
      newColorObject.gradients.splice(index, 1)
      const updatedObject = regenerateGradientCss(newColorObject)
      emit("update:modelValue", updatedObject)
      emit("manual-update")
    }

    function updateGradientStop(index) {
      const stop = gradientStops.value[index]
      const rgba = parseColorString(stop.inputValue)

      if (rgba) {
        stop.errorMessage = ""
        const newColorObject = { ...props.modelValue }
        newColorObject.gradients[index].color = rgba

        const updatedObject = regenerateGradientCss(newColorObject)
        emit("update:modelValue", updatedObject)
        emit("manual-update")
      } else {
        stop.errorMessage = "Invalid color format."
      }
    }

    function parseColorString(str) {
      str = str.trim()
      // Hex to RGBA
      let match = str.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
      if (match) {
        return {
          r: parseInt(match[1], 16),
          g: parseInt(match[2], 16),
          b: parseInt(match[3], 16),
          a: 1,
        }
      }

      // Short-hex to RGBA
      match = str.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i)
      if (match) {
        return {
          r: parseInt(match[1] + match[1], 16),
          g: parseInt(match[2] + match[2], 16),
          b: parseInt(match[3] + match[3], 16),
          a: 1,
        }
      }

      // RGBA string to RGBA
      match = str.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i)
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: match[4] !== undefined ? parseFloat(match[4]) : 1,
        }
      }

      return null
    }

    function updateColor() {
      const rgba = parseColorString(inputValue.value)
      if (rgba) {
        errorMessage.value = ""
        const newColorObject = {
          mode: "solid",
          color: rgba,
          css: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
        }
        emit("update:modelValue", newColorObject)
        emit("manual-update")
      } else {
        errorMessage.value = "Invalid color format."
      }
    }

    return {
      inputValue,
      errorMessage,
      swatchColor,
      isGradient,
      gradientStops,
      updateColor,
      updateGradientStop,
      removeGradientStop,
    }
  },
}
</script>

<style scoped>
.has-action-button .color-text-input {
}
.action-button {
  position: absolute;
  left: -4px;
  top: 11px;
  height: fit-content;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #9ca3af; /* gray-400 */
  border-radius: 0 6px 6px 0;
  padding: 2px;
}
.action-button:hover:not(:disabled) {
  color: #374151; /* gray-700 */
  background-color: #f3f4f6; /* gray-100 */
}
.action-button:disabled {
  color: #d1d5db; /* gray-300 */
  cursor: not-allowed;
}
.manual-color-input-wrapper {
  /* Styling is now more compact to fit inside the picker */
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb; /* Corresponds to gray-200 */
  background-color: #ffffff; /* Match picker background */
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-with-swatch {
  position: relative;
  padding: 0.5rem 0;
}

.color-text-input {
  margin-left: -5px;
}

.color-swatch-container {
  position: absolute;
  right: -4px;
  top: 12px;
  display: flex;
}
.color-swatch {
  width: 22px;
  height: 22px;
  display: block;
  border-radius: 50%;
}
.form-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
  text-align: left;
}
.error-message {
  color: var(--warning-color);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: inline-block;
}
.gradient-stop-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}
.manual-color-input-wrapper input {
  padding: 0.5rem 0 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}
</style>
