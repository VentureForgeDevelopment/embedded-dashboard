<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Website Settings</h3>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <div v-if="license" id="domain-settings" class="settings-form">
          <!-- Website Info -->
          <div class="form-section">
            <h4 class="section-title">Website</h4>
            <div class="form-group">
              <label class="form-label" for="domain-input">Domain:</label>
              <DomainSelect v-model="formData.domain" />
              <small class="form-help"
                >Enter your website domain (e.g., example.com). Subdomains like
                dev.example.com will also work.</small
              >
            </div>
          </div>
          <!-- Languages Settings -->
          <div id="languages-settings" class="form-section">
            <h4 class="section-title">Languages</h4>
            <div class="form-group">
              <LanguageSelect
                v-model="formData.languages"
                :language-limit="languageLimit"
              />
            </div>
          </div>

          <!-- Icon Settings -->
          <div id="icon-settings" class="form-section">
            <h4 class="section-title">Icon</h4>
            <div class="form-group">
              <label class="form-label">Select an icon for the toolbar:</label>
              <div class="radio-group">
                <label
                  v-for="icon in availableIcons"
                  :key="icon.id"
                  class="radio-option"
                >
                  <input
                    type="radio"
                    :value="icon.id"
                    v-model="formData.icon.id"
                    @change="clearMessages"
                  />
                  <!-- Render SVG or Image based on type -->
                  <span v-if="icon.type === 'svg'" class="icon-preview">
                    <span
                      v-html="icon.data"
                    ></span>
                    <span class="icon-name">{{ formattedIconId(icon.id) }}</span>
                  </span>
                  <span v-else class="icon-preview">
                    <img :src="icon.data" :alt="icon.id" />
                    <span class="icon-name">{{ formattedIconId(icon.id) }}</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        
          <!-- <ColorPicker v-model="formData.icon.color" @colorChanged="handleGradientChange" />


          {{ formData.icon }} -->
          

          <!-- Text-to-Speech Settings -->
          <div id="tts-settings" class="form-section">
            <h4 class="section-title">Text-to-Speech (TTS)</h4>
            <div class="form-group">
              <label class="toggle-label">
                <input
                  type="checkbox"
                  v-model="formData.ttsEnabled"
                  @change="clearMessages"
                  class="toggle-checkbox"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">
                  {{ formData.ttsEnabled ? 'Enabled' : 'Disabled' }}
                </span>
              </label>
              <small class="form-help">
                Enable text-to-speech functionality for your website.
                <template v-if="license && license.type === 'manual'">
                  Manual licenses use AWS Polly with voice selection.
                </template>
              </small>
            </div>

            <!-- Enable Highlighting (only shown when TTS is enabled) -->
            <div v-if="formData.ttsEnabled" class="form-group">
              <label class="toggle-label">
                <input
                  type="checkbox"
                  v-model="formData.ttsHighlighting"
                  @change="clearMessages"
                  class="toggle-checkbox"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">
                  Enable Highlighting {{ formData.ttsHighlighting ? '(On)' : '(Off)' }}
                </span>
              </label>
              <small class="form-help">
                Highlight text while it's being read aloud.
              </small>
            </div>
          </div>

          <!-- enable poly **for manual licenses only -->
          <div v-if="formData.ttsEnabled && license.type === 'manual'" class="form-group">
              <label class="toggle-label">
                <input
                  type="checkbox"
                  v-model="formData.polyEnabled"
                  @change="clearMessages"
                  class="toggle-checkbox"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">
                  Enable Poly {{ formData.polyEnabled ? '(On)' : '(Off)' }}
                </span>
              </label>
              <small class="form-help">
                Enable Poly for manual licenses.
              </small>
            </div>

          <!-- Position Settings -->
          <div id="display-settings" class="form-section">
            <h4 class="section-title">Toolbar Position</h4>

            <!-- Horizontal Position -->
            <div class="form-group">
              <label class="form-label">Horizontal Position:</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    type="radio"
                    value="left"
                    v-model="formData.position.horizontal"
                    @change="clearMessages"
                  />
                  <span>Left</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="middle"
                    v-model="formData.position.horizontal"
                    @change="clearMessages"
                  />
                  <span>Middle</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="right"
                    v-model="formData.position.horizontal"
                    @change="clearMessages"
                  />
                  <span>Right</span>
                </label>
              </div>
            </div>

            <!-- Vertical Position -->
            <div class="form-group">
              <label class="form-label">Vertical Position:</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    type="radio"
                    value="top"
                    v-model="formData.position.vertical"
                  />
                  <span>Top</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="middle"
                    v-model="formData.position.vertical"
                  />
                  <span>Middle</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="bottom"
                    v-model="formData.position.vertical"
                  />
                  <span>Bottom</span>
                </label>
              </div>
            </div>

            <!-- Offsets -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="horizontal-offset"
                  >Horizontal Offset (px):</label
                >
                <input
                  id="horizontal-offset"
                  type="number"
                  v-model.number="formData.position.horizontalOffset"
                  min="0"
                  max="500"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="vertical-offset"
                  >Vertical Offset (px):</label
                >
                <input
                  id="vertical-offset"
                  type="number"
                  v-model.number="formData.position.verticalOffset"
                  min="0"
                  max="500"
                  class="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Error/Success Messages -->
        <div v-if="error || success" class="message-container">
          <div v-if="error" class="error-message">
            <svg
              class="message-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            {{ error }}
          </div>
          <div v-if="success" class="success-message">
            <svg
              class="message-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            {{ success }}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="closeModal"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          @click="saveSettings"
          :disabled="loading"
        >
          {{ loading ? "Saving..." : "Save Settings" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue"
import DomainSelect from "./DomainSelect.vue"
import LanguageSelect from "./LanguageSelect.vue"
import { useLicenseStore } from "../stores/license"
// import ColorPicker from "@mcistudio/vue-colorpicker"
// import "@mcistudio/vue-colorpicker/dist/style.css";

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  license: {
    type: Object,
    default: null,
  },
  scrollToSectionId: {
    type: String,
    default: null,
  },
})

// Emits
const emit = defineEmits(["close", "save"])

// Store
const licenseStore = useLicenseStore()

// State
const loading = ref(false)
const error = ref("")
const success = ref("")
const formData = ref({
  domain: "",
  languages: [],
  position: {
    horizontal: "right",
    vertical: "bottom",
    horizontalOffset: 20,
    verticalOffset: 20,
  },
  icon: {
    id: "default",
    color: "#4f46e5",
    background_color: {
      mode: "solid",
      color: "#4f46e5",
    }
  },
  ttsEnabled: false,
  ttsHighlighting: true, // Default to true
  polyEnabled: false,
})

// const handleGradientChange = (colorData) => {
//   console.log(colorData)
//   // formData.value.icon.background_color.color = colorData.hex
//   // formData.value.icon.background_color.gradient = colorData.gradient
// }
// Computed
const availableIcons = computed(() => licenseStore.state.icons)

const languageLimit = computed(() => {
  if (props.license && props.license.type && props.license.type === "manual") {
    return 25
  }

  let limit = 0

  if (props.license && props.license.product) {
    const subType = props.license.product.toLowerCase()
    if (subType.includes("starter")) limit = 1
    if (subType.includes("growth")) limit = 3
    if (subType.includes("pro")) limit = 5
  }

  return limit
})

function formattedIconId(iconId) {
  return iconId
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

watch(
  () => formData.value.languages,
  (newVal) => {
    if (newVal.length > languageLimit.value) {
      formData.value.languages.splice(languageLimit.value)
    }
  },
  { deep: true }
)

// Watch for show prop to scroll to a section
watch(
  () => props.show,
  async (newVal) => {
    if (newVal && props.scrollToSectionId) {
      await nextTick() // Wait for the modal and its content to be rendered
      const modalContainer = document.querySelector(".modal-container")
      const element = document.querySelector(props.scrollToSectionId)
      if (element && modalContainer) {
        modalContainer.scrollTo({ top: element.offsetTop, behavior: "smooth" })
      }
    }
  }
)

// Watch for license changes and populate form
watch(
  () => props.license,
  (newLicense) => {
    if (newLicense) {
      // Handle cases where settings might not exist or be incomplete
      const settings = newLicense.settings || {}
      const position = settings.position || {}

      // Ensure icon setting is an object
      const icon =
        typeof settings.icon === "object" && settings.icon !== null
          ? settings.icon
          : { id: "default" }

      formData.value = {
        domain: newLicense.domain_name || newLicense.name || "",
        languages: settings.languages || [{ code: "en", name: "English" }],
        position: {
          horizontal: position.horizontal || "right",
          vertical: position.vertical || "bottom",
          horizontalOffset:
            position.horizontalOffset !== undefined
              ? position.horizontalOffset
              : 20,
          verticalOffset:
            position.verticalOffset !== undefined
              ? position.verticalOffset
              : 20,
        },
        icon: {
          id: icon.id || "default",
          color: icon.color || "black",
          background_color: {
            mode: icon.background_color?.mode || "solid",
            color: icon.background_color?.color || "white"
          }
        },
        ttsEnabled: settings.ttsEnabled ?? false,
        ttsHighlighting: settings.ttsHighlighting ?? true,
        polyEnabled: settings.polyEnabled ?? false,
      }
    }
  },
  { immediate: true }
)

// Methods
const closeModal = () => {
  error.value = ""
  success.value = ""
  emit("close")
}

// Clear messages when form data changes
const clearMessages = () => {
  error.value = ""
  success.value = ""
}

const saveSettings = async () => {
  if (!props.license) return

  // Clear previous messages
  error.value = ""
  success.value = ""
  loading.value = true

  try {
    const settings = {
      languages: formData.value.languages,
      position: formData.value.position,
      icon: formData.value.icon,
    }

    console.log('Modal emitting save with ttsHighlighting:', formData.value.ttsHighlighting)

    const eventPayload = {
      licenseId: props.license.id,
      domain: formData.value.domain,
      settings: settings,
      ttsEnabled: formData.value.ttsEnabled,
      ttsHighlighting: formData.value.ttsHighlighting,
      polyEnabled: formData.value.polyEnabled ? true : false,
      onSuccess: (message) => {
        loading.value = false
        success.value = message || "Settings saved successfully!"
        setTimeout(() => {
          closeModal()
        }, 1500)
      },
      onError: (errorMessage) => {
        loading.value = false
        error.value = errorMessage
      },
    }

    console.log('About to emit save event with payload:', eventPayload)
    emit("save", eventPayload)
  } catch (err) {
    console.error("Error saving settings:", err)
    error.value = err.message || "An unexpected error occurred"
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.icon-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-preview img,
.icon-preview :deep(svg) {
  width: 54px;
  height: 54px;
}

.icon-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 2rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}
.radio-option span {
  text-transform: capitalize;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.domain-display {
  font-family: monospace;
  background: var(--bg-secondary);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: var(--text-primary);
  font-weight: 500;
}

.language-label {
  font-size: 0.9rem;
  color: var(--text-primary);
}

:deep(.language-select-wrapper) {
  display: block;
}
:deep(.selected-languages-wrapper) {
  margin-top: 1rem;
}
:deep(.selected-languages-display) {
  background: none;
  min-height: fit-content;
  max-height: max-content;
}
.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.radio-option:hover {
  background: var(--bg-hover);
}

.radio-option input[type="radio"] {
  margin: 0;
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-help {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
}

/* Message Styling */
.message-container {
  margin-top: 1rem;
}

.error-message,
.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.message-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Toggle Switch Styles */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.toggle-checkbox {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 48px;
  height: 24px;
  background: var(--border-color);
  border-radius: 24px;
  transition: background 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-checkbox:checked + .toggle-slider {
  background: #22c55e;
}

.toggle-checkbox:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .modal-container {
    margin: 1rem;
    max-width: calc(100% - 2rem);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .language-grid {
    grid-template-columns: 1fr;
  }

  .languages-selection-wrapper {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .radio-group {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
