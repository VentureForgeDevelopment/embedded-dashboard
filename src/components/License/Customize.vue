<template>
  <div class="overview-section">
    <!-- Notifications -->
    <SlideInNotification
      :show="showSuccessNotification"
      :message="successMessage"
      type="success"
    />
    <SlideInNotification
      :show="showFailNotification"
      :message="failMessage"
      type="fail"
    />

    <!-- Loading Overlay -->
    <div v-if="isSaving" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Saving...</p>
    </div>

    <!-- Display Settings Card -->
    <div class="overview-card display-settings-card" :class="{ dirty: isDisplayDirty }">
      <div class="card-header">
        <h3 class="card-title" :class="{ 'dirty-header': isDisplayDirty }">
          Display
        </h3>
      </div>
      <div class="card-content">
        <div class="form-group">
          <label class="form-label">Display Mode</label>
          <div class="radio-group">
            <label class="radio-option">
              <input type="radio" value="floating" v-model="displayMode" />
              <span>Floating</span>
            </label>
            <label class="radio-option">
              <input type="radio" value="embedded" v-model="displayMode" />
              <span>Embedded</span>
            </label>
          </div>
        </div>
        <div v-if="displayMode === 'embedded'" class="form-group" style="margin-top: 1rem;">
          <label class="form-label" for="css-selector">CSS Selector for Embedded Element</label>
          <input
            id="css-selector"
            type="text"
            v-model="cssSelector"
            placeholder="#my-custom-element"
            class="form-input"
            :class="{ 'input-error': !isCssSelectorValid && cssSelector }"
          />
          <small v-if="!isCssSelectorValid && cssSelector" class="form-help error-text">
            Please enter a valid CSS selector.
          </small>
          <small class="form-help">The CSS selector for the HTML element where the widget will be embedded.</small>
        </div>
        <div v-if="displayMode === 'embedded'" class="form-group" style="margin-top: 1rem;">
          <label class="form-label" for="custom-css">Custom CSS</label>
          <textarea
            id="custom-css"
            v-model="customCss"
            placeholder=".widget-class { border-radius: 8px; }"
            class="form-input"
            :class="{ 'input-error': !isCustomCssValid && customCss }"
            rows="5"
          ></textarea>
          <small v-if="!isCustomCssValid && customCss" class="form-help error-text">
            Please enter valid CSS rules.
          </small>
          <small class="form-help">Add custom CSS rules to style the embedded widget. This will be applied within the widget's scope.</small>
        </div>
      </div>
    </div>

    <div class="overview-grid">
      <button
        class="btn btn-outline reset-settings-btn"
        @click="restoreDefaults"
        :disabled="isSaving"
      >
        Reset to Default Settings
      </button>

      <!-- Position Settings Card -->
      <div v-if="displayMode === 'floating'" class="overview-card" :class="{ dirty: isPositionDirty }">
        <div class="card-header">
          <h3 class="card-title" :class="{ 'dirty-header': isPositionDirty }">
            Position
          </h3>
        </div>
        <div class="card-content">
          <!-- Horizontal & Vertical Position -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Horizontal Position</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    type="radio"
                    value="left"
                    v-model="position.horizontal"
                  />
                  <span>Left</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="middle"
                    v-model="position.horizontal"
                  />
                  <span>Middle</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="right"
                    v-model="position.horizontal"
                  />
                  <span>Right</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Vertical Position</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" value="top" v-model="position.vertical" />
                  <span>Top</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="middle"
                    v-model="position.vertical"
                  />
                  <span>Middle</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="bottom"
                    v-model="position.vertical"
                  />
                  <span>Bottom</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Horizontal & Vertical Offset -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="horizontal-offset"
                >Horizontal Offset (px)</label
              >
              <input
                id="horizontal-offset"
                type="number"
                v-model.number="position.horizontalOffset"
                min="0"
                max="500"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="vertical-offset"
                >Vertical Offset (px)</label
              >
              <input
                id="vertical-offset"
                type="number"
                v-model.number="position.verticalOffset"
                min="0"
                max="500"
                class="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Icon Card -->
      <div v-if="displayMode === 'floating'" class="overview-card" :class="{ dirty: isIconDirty }">
        <div class="card-header">
          <h3 class="card-title" :class="{ 'dirty-header': isIconDirty }">
            Launcher
          </h3>
        </div>
        <div class="card-content">
          <div class="radio-group icon-radio-group">
            <label
              v-for="icon in availableIcons"
              :key="icon.id"
              class="radio-option icon-option"
            >
              <input type="radio" :value="icon.id" v-model="selectedIconId" />
              <span v-if="icon.type === 'svg'" class="icon-preview">
                <div
                  class="icon-bg"
                  :style="iconBgStyle"
                >
                  <span v-html="defaultIconPreviewSvg"></span>
                </div>
                <span class="icon-name">{{ formattedIconId(icon.id) }}</span>
              </span>
              <span v-else-if="icon.type === 'image'" class="icon-preview">
                <img :src="icon.data" :alt="icon.id" />
                <span class="icon-name">{{ formattedIconId(icon.id) }}</span>
              </span>
              <span v-else>
                <p>
                  {{ icon.name }}
                </p>
              </span>
            </label>
          </div>

          <br>
          <div class="form-group flag-settings">
            <label class="toggle-label">
              <input
                type="checkbox"
                class="toggle-checkbox"
                v-model="flagIcon"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-text">Show Flag</span>
            </label>

            <div v-if="flagIcon">
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    type="radio"
                    value="floating"
                    v-model="flagIconPosition"
                  />
                  <span>Floating</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="center"
                    v-model="flagIconPosition"
                  />
                  <span>Centered</span>
                </label>
              </div>
            </div>
          </div>

          <div
            v-if="selectedIconId === 'default' && (!flagIcon || flagIconPosition !== 'center')"
            class="form-group"
            style="margin-top: 1rem"
          >
            <label class="form-label" for="default-icon-variant"
              >Icon Style</label
            >
            <select
              id="default-icon-variant"
              class="form-input"
              v-model="selectedIconName"
            >
              <option
                v-for="variant in defaultIconVariants"
                :key="variant.name"
                :value="variant.name"
              >
                {{ variant.displayName }}
              </option>
            </select>
          </div>

          <div
            v-if="selectedIconId === 'default'"
            class="icon-bg-color-section"
          >
            <br />
            <p class="form-label">Icon Color</p>
            <div class="simple-color-picker">
              <input
                type="color"
                v-model="iconColor"
                class="color-input-native"
              />
              <div class="color-input-display">
                <span class="swatch-wrapper">
                  <span
                    class="color-swatch"
                    :style="{ backgroundColor: iconColor }"
                  ></span>
                </span>
                <span class="color-value">Color</span>
                <Pencil
                  fill-color="gray"
                  style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  "
                />
              </div>
            </div>
          </div>

          <div
            v-if="selectedIconId !== 'no_icon'"
            class="card-content"
            style="padding-top: 0"
          >
            <hr />
            <div class="form-group" style="padding-top: 1rem">
              <label class="form-label">Size</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" value="small" v-model="iconSize" />
                  <span>Small</span>
                </label>
                <label class="radio-option">
                  <input type="radio" value="large" v-model="iconSize" />
                  <span>Large</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Embedding Style Card -->
      <div v-if="displayMode === 'embedded'" class="overview-card" :class="{ dirty: isEmbeddedStyleDirty }">
        <div class="card-header">
          <h3 class="card-title" :class="{ 'dirty-header': isEmbeddedStyleDirty }">
            Style
          </h3>
        </div>
        <div class="card-content">
          <div class="form-group">
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" value="full" v-model="embeddedStyle" />
                <span>Language Names & Icons</span>
              </label>
              <label class="radio-option">
                <input type="radio" value="icons_only" v-model="embeddedStyle" />
                <span>Icons Only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Colors Card -->
      <div class="overview-card" :class="{ dirty: isColorsDirty }">
        <div class="card-header">
          <h3 class="card-title" :class="{ 'dirty-header': isColorsDirty }">
            Colors
          </h3>
        </div>
        <div class="card-content">
          <div class="color-selection" @click="openAccentColorPicker">
            <ColorPicker
              @click.stop
              ref="accentColorPicker"
              :key="accentColorPickerKey"
              class="full-color-picker"
              v-model="accentColor"
              :mode="accentColor.mode"
            />
            <p>Accent Color</p>
            <Pencil
              fill-color="gray"
              style="
                display: flex;
                justify-content: center;
                align-items: center;
              "
            />
          </div>
          <teleport :to="colorPickerPopupEl" v-if="isAccentColorPickerOpen && colorPickerPopupEl" defer>
            <ManualColorInput v-model="accentColor" @manual-update="forceAccentColorPickerUpdate" />
          </teleport>

          <!-- <hr />
          <div class="form-group" style="padding-top: 1rem">
            <label class="form-label">Accent Text Color</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" value="white" v-model="accentTextColor" />
                <span
                  class="color-swatch-small"
                  style="background-color: white; border: 1px solid #ccc"
                ></span>
                <span>White</span>
              </label>
              <label class="radio-option">
                <input type="radio" value="black" v-model="accentTextColor" />
                <span
                  class="color-swatch-small"
                  style="background-color: black"
                ></span>
                <span>Black</span>
              </label>
            </div>
          </div> -->
        </div>
      </div>

      <!-- text to Speech Card -->
      <div v-if="displayMode === 'floating'" class="overview-card" :class="{ dirty: isTtsDirty && !isFree }">
        <div class="card-header">
          <h3 class="card-title" :class="{ 'dirty-header': isTtsDirty && !isFree }">
            Text to Speech
          </h3>
          <span v-if="isFree" class="premium-badge">Premium</span>
        </div>
        <div class="card-content">
          <!-- Free tier upgrade prompt -->
          <div v-if="isFree" class="tts-upgrade-prompt">
            <p class="upgrade-text">
              Text-to-Speech is a premium feature that allows visitors to listen to your translated content.
            </p>
            <button @click="goToCheckout" class="btn btn-outline btn-sm">Upgrade to Enable</button>
          </div>

          <!-- Normal TTS controls for paid users -->
          <template v-else>
            <div class="form-group">
              <label class="toggle-label">
                <input
                  type="checkbox"
                  class="toggle-checkbox"
                  v-model="ttsEnabled"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">Enable Text-to-Speech</span>
              </label>
              <small class="form-help"
                >Enable or disable the text-to-speech functionality.</small
              >
            </div>

            <div v-if="ttsEnabled" class="form-group">
              <label class="toggle-label">
                <input
                  type="checkbox"
                  class="toggle-checkbox"
                  v-model="ttsHighlighting"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">Enable Highlighting</span>
              </label>
              <small class="form-help"
                >Highlight text as it is being read aloud.</small
              >
            </div>

            <div
              v-if="ttsEnabled && license.type === 'manual'"
              class="form-group"
            >
              <label class="toggle-label">
                <input
                  type="checkbox"
                  class="toggle-checkbox"
                  v-model="polyEnabled"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">Enable AWS Polly Voices</span>
              </label>
              <small class="form-help"
                >Use enhanced AWS Polly voices (for manual licenses only).</small
              >
            </div>
          </template>
        </div>
      </div>

      <!-- preview panel card -->
      <div class="overview-card preview-panel">
        <div class="card-header">
          <h3 class="card-title">Preview</h3>
        </div>
        <div class="card-content">
          <LivePreview
            v-if="license.name"
            :license="{ ...license, settings: currentSettings }"
          />
        </div>
      </div>
    </div>

    <!-- Save All Changes Button - Fixed at bottom -->
    <div class="overview-header-fixed" v-if="hasUnsavedChanges">
      <button
        class="btn btn-primary"
        @click="saveAllSettings"
        :disabled="isSaving"
      >
        <span v-if="isSaving">Saving...</span>
        <span v-else>Save</span>
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, nextTick } from "vue"
import { onBeforeRouteLeave, useRouter } from "vue-router"
import { useLicenseStore } from "../../stores/license"
import ColorPicker from "@mcistudio/vue-colorpicker"
import "@mcistudio/vue-colorpicker/dist/style.css"
import SlideInNotification from "../SlideInNotification.vue"
import Pencil from "vue-material-design-icons/Pencil.vue"
import LivePreview from "./LivePreview.vue"
import ManualColorInput from "./ManualColorInput.vue" 

export default {
  name: "Customize",
  props: {
    license: {
      type: Object,
      required: true,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ColorPicker,
    SlideInNotification,
    Pencil,
    LivePreview,
    ManualColorInput,
  },
  emits: ["setting-saved"],
  setup(props, { emit }) {
    const licenseStore = useLicenseStore()
    const router = useRouter()

    // Store original settings to detect changes
    const originalSettings = ref({})

    const isSaving = computed(() => licenseStore.state.loading.licenses)

    const showSuccessNotification = ref(false)
    const successMessage = ref("")
    const showFailNotification = ref(false)
    const failMessage = ref("")

    const displayMode = ref("floating")
    const cssSelector = ref("")
    const customCss = ref("")
    const embeddedStyle = ref("full")

    const position = ref({
      horizontal: "right",
      vertical: "bottom",
      horizontalOffset: 20,
      verticalOffset: 20,
    })

    const selectedIconId = ref("default")

    const selectedIconName = ref("globe")

    const iconColor = ref("#FFFFFF")

    const iconSize = ref("large")

    const flagIcon = ref(true)
    const flagIconPosition = ref("floating")

    // const accentTextColor = ref("white")

    const ttsEnabled = ref(false)
    const ttsHighlighting = ref(true)
    const polyEnabled = ref(false)

    const accentColorPicker = ref(null)
    const accentColorPickerKey = ref(0)
    const isAccentColorPickerOpen = ref(false)
    const colorPickerPopupEl = ref(null)

    const accentColor = ref({
      mode: "linear",
      degree: 135,
      gradients: [
        { percent: 0, color: { r: 102, g: 126, b: 234, a: 1 } },
        { percent: 100, color: { r: 118, g: 75, b: 162, a: 1 } },
      ],
      css: "background-image:linear-gradient(135deg,rgba(102,126,234,1) 0%,rgba(118,75,162,1) 100%)",
    })

    watch(
      () => props.license.settings,
      (newSettings) => {
        if (!newSettings) return

        // Create a deep copy of the incoming settings immediately. This is our pristine "original" state
        // before the color picker component can introduce rounding errors.
        const pristineSettings = JSON.parse(JSON.stringify(newSettings))

        const iconSettings = newSettings?.icon
        const newPosition = newSettings?.position
        const colors = newSettings?.colors

        // Initialize display settings
        displayMode.value = newSettings?.display?.mode ?? "floating"
        cssSelector.value = newSettings?.display?.css_selector || ""
        customCss.value = newSettings?.display?.custom_css || ""
        embeddedStyle.value = newSettings?.display?.embedded_style || "full"

        // Initialize position settings
        if (newPosition) {
          position.value.horizontal = newPosition.horizontal ?? "right"
          position.value.vertical = newPosition.vertical ?? "bottom"
          position.value.horizontalOffset = newPosition.horizontalOffset ?? 20
          position.value.verticalOffset = newPosition.verticalOffset ?? 20
        }

        // Initialize icon settings
        if (iconSettings) {
          selectedIconId.value = iconSettings.id || "default"
          iconColor.value = iconSettings.color || "#FFFFFF"
          selectedIconName.value = iconSettings.name || "globe"
          iconSize.value = iconSettings.size || "large"
          flagIcon.value = iconSettings.flag_icon ?? true
          flagIconPosition.value = iconSettings.flag_icon_position || "floating"
        }

        // Initialize TTS settings
        ttsEnabled.value = newSettings?.ttsEnabled ?? false
        ttsHighlighting.value = newSettings?.ttsHighlighting ?? true
        polyEnabled.value = newSettings?.polyEnabled ?? false

        // Initialize accent color
        if (colors && colors.accent_color) {
          accentColor.value = colors.accent_color
          // accentTextColor.value = colors.accent_text || "white"
        }

        // Store a deep copy of the initial settings for dirty checking
        originalSettings.value = JSON.parse(
          JSON.stringify({
            display: {
              mode: pristineSettings.display?.mode ?? "floating",
              css_selector: pristineSettings.display?.css_selector || "",
              custom_css: pristineSettings.display?.custom_css || "",
              embedded_style: pristineSettings.display?.embedded_style || "full",
            },
            position: pristineSettings.position,
            icon: {
              id: pristineSettings.icon?.id || "default",
              color: pristineSettings.icon?.color || "#FFFFFF",
              name: pristineSettings.icon?.name || "globe",
              size: pristineSettings.icon?.size || "large",
              flag_icon: pristineSettings.icon?.flag_icon ?? true,
              flag_icon_position:
                pristineSettings.icon?.flag_icon_position || "floating",
            },
            colors: {
              accent_color: pristineSettings.colors?.accent_color,
              accent_text: pristineSettings.colors?.accent_text || "white",
            },
            ttsEnabled: pristineSettings.ttsEnabled ?? false,
            ttsHighlighting: pristineSettings.ttsHighlighting ?? true,
            polyEnabled: pristineSettings.polyEnabled ?? false,
          })
        )
      },
      { immediate: true, deep: true }
    )

    const availableIcons = computed(() => licenseStore.state.icons)

    function formattedIconId(iconId) {
      return iconId
        .replace(/[_-]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    const iconObjectToSave = computed(() => ({
      id: selectedIconId.value,
      name: selectedIconName.value,
      color: iconColor.value,
      size: iconSize.value,
      flag_icon: flagIcon.value,
      flag_icon_position: flagIconPosition.value,
    }))

    const defaultIconVariants = computed(() => {
      const defaultIcon = availableIcons.value.find(
        (icon) => icon.id === "default"
      )
      return defaultIcon ? defaultIcon.variants : []
    })

    const defaultIconPreviewSvg = computed(() => {
      const defaultIcon = availableIcons.value.find(
        (icon) => icon.id === "default"
      )
      if (!defaultIcon) return ""

      const selectedVariant = defaultIcon.variants.find(
        (v) => v.name === selectedIconName.value
      )
      return selectedVariant
        ? selectedVariant.data
        : defaultIcon.variants[0]?.data || ""
    })

    const iconBgStyle = computed(() => {
      if (!accentColor.value) return {}

      if (accentColor.value.mode === 'solid') {
        const c = accentColor.value.color
        return { background: `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})` }
      }
      
      if (accentColor.value.css) {
        return { background: accentColor.value.css.replace('background-image:', '') }
      }
      return {}
    })

    // --- Dirty Checking Computeds ---
    const isDisplayDirty = computed(() => {
      if (!originalSettings.value.display) return false
      const original = originalSettings.value.display
      const modeIsDirty = original.mode !== displayMode.value
      const selectorIsDirty = (original.css_selector || "") !== cssSelector.value
      const customCssIsDirty = (original.custom_css || "") !== customCss.value

      if (displayMode.value === 'embedded') {
        return modeIsDirty || selectorIsDirty || customCssIsDirty
      }

      return modeIsDirty
    })

    const isEmbeddedStyleDirty = computed(() => {
      if (!originalSettings.value.display) return false
      const original = originalSettings.value.display
      return (original.embedded_style || "full") !== embeddedStyle.value
    })

    const isPositionDirty = computed(() => {
      if (!originalSettings.value.position) {
        return false // Nothing to compare against
      }
      const originalPos = originalSettings.value.position
      const currentPos = position.value
      return (
        originalPos.horizontal !== currentPos.horizontal ||
        originalPos.vertical !== currentPos.vertical ||
        originalPos.horizontalOffset !== currentPos.horizontalOffset ||
        originalPos.verticalOffset !== currentPos.verticalOffset
      )
    })
    const isIconDirty = computed(() => {
      if (!originalSettings.value.icon) return false

      const originalIcon = originalSettings.value.icon
      const currentIcon = iconObjectToSave.value

      // Compare only the specific properties that matter, ignoring extra properties
      // added by the color picker component.
      const idIsDirty = originalIcon.id !== currentIcon.id
      const nameIsDirty = originalIcon.name !== currentIcon.name
      const colorIsDirty = originalIcon.color !== currentIcon.color
      const sizeIsDirty = originalIcon.size !== currentIcon.size
      const flagIsDirty = originalIcon.flag_icon !== currentIcon.flag_icon
      const flagPositionIsDirty =
        originalIcon.flag_icon_position !== currentIcon.flag_icon_position

      return (
        idIsDirty ||
        nameIsDirty ||
        colorIsDirty ||
        sizeIsDirty ||
        flagIsDirty ||
        flagPositionIsDirty
      )
    })

    const isColorsDirty = computed(() => {
      if (!originalSettings.value.colors) return false

      const originalColors = originalSettings.value.colors
      let accentColorIsDirty = false

      if (accentColor.value.mode === "solid") {
        // For solid colors, a simple CSS string comparison is sufficient and reliable.

        accentColorIsDirty =
          originalColors.accent_color?.color?.r !==
            accentColor.value.color?.r ||
          originalColors.accent_color?.color?.g !==
            accentColor.value.color?.g ||
          originalColors.accent_color?.color?.b !==
            accentColor.value.color?.b ||
          originalColors.accent_color?.color?.a !== accentColor.value.color?.a
      } else {
        // For gradients, use the fuzzy comparison to avoid floating point issues.
        accentColorIsDirty = areGradientsDirty(
          originalColors.accent_color,
          accentColor.value
        )
      }
      // const textIsDirty = originalColors.accent_text !== accentTextColor.value
      return accentColorIsDirty
    })

    const isTtsDirty = computed(
      () =>
        originalSettings.value.ttsEnabled !== ttsEnabled.value ||
        originalSettings.value.ttsHighlighting !== ttsHighlighting.value ||
        originalSettings.value.polyEnabled !== polyEnabled.value
    )

    /**
     * Compares two gradient color objects and determines if they are different
     * beyond a small tolerance for RGBA values. This prevents false positives
     * from color picker rounding errors.
     * @param {object} originalGradient The original gradient color object.
     * @param {object} currentGradient The current gradient color object.
     * @returns {boolean} True if the colors are meaningfully different.
     */
    function areGradientsDirty(originalGradient, currentGradient) {
      if (!originalGradient || !currentGradient) {
        return originalGradient !== currentGradient // Handle cases where one is null/undefined
      }

      // Quick check for simple cases
      if (originalGradient.css === currentGradient.css) return false
      if (originalGradient.mode !== currentGradient.mode) return true
      if (
        originalGradient.gradients?.length !== currentGradient.gradients?.length
      )
        return true

      const tolerance = 2 // Allow RGBA values to be off by this much

      for (let i = 0; i < originalGradient.gradients.length; i++) {
        const ogColor = originalGradient.gradients[i].color
        const curColor = currentGradient.gradients[i].color

        if (
          Math.abs(ogColor.r - curColor.r) > tolerance ||
          Math.abs(ogColor.g - curColor.g) > tolerance ||
          Math.abs(ogColor.b - curColor.b) > tolerance ||
          Math.abs(ogColor.a - curColor.a) > tolerance
        ) {
          return true // Found a significant difference
        }
      }

      return false // No significant differences found
    }

    const hasUnsavedChanges = computed(
      () =>
        isPositionDirty.value ||
        isDisplayDirty.value ||
        isEmbeddedStyleDirty.value ||
        isIconDirty.value ||
        isColorsDirty.value ||
        isTtsDirty.value
    )

    const isCssSelectorValid = computed(() => {
      if (!cssSelector.value) return true // Empty is valid until required
      try {
        document.querySelector(cssSelector.value)
        return true
      } catch (e) {
        return false
      }
    })

    const isCustomCssValid = computed(() => {
      if (!customCss.value) return true // Empty is considered valid
      // This is a basic check for what looks like CSS.
      // It checks for at least one rule block.
      // A more robust solution might involve a CSS parser library if stricter validation is needed.
      const cssPattern = /.+?\{.+?\}/s;
      return cssPattern.test(customCss.value);
    });


    const currentSettings = computed(() => ({
      position: position.value,
      display: {
        mode: displayMode.value,
        css_selector: cssSelector.value,
        custom_css: customCss.value,
        embedded_style: embeddedStyle.value,
      },
      icon: iconObjectToSave.value,
      colors: {
        accent_color: accentColor.value,
      },
      // Note: tts settings are passed at the root of the payload, not in 'settings'
      // but we can include them here for simplicity if the SDK handles it.
      // For now, assuming SDK only needs display settings.
      ttsEnabled: ttsEnabled.value,
      ttsHighlighting: ttsHighlighting.value,
      polyEnabled: polyEnabled.value,
    }))

    // --- Methods ---
    function saveAllSettings() {
      if (displayMode.value === 'embedded' && (!cssSelector.value || !isCssSelectorValid.value)) {
        failMessage.value = "A valid CSS selector is required for embedded mode."
        showFailNotification.value = true
        setTimeout(() => (showFailNotification.value = false), 3000)
        return;
      }

      if (displayMode.value === 'embedded' && !isCustomCssValid.value) {
        failMessage.value = "The custom CSS you entered appears to be invalid."
        showFailNotification.value = true
        setTimeout(() => (showFailNotification.value = false), 3000)
        return;
      }


      const payload = {
        license_id: props.license.id,
        settings: {},
      }

      if (isDisplayDirty.value || isEmbeddedStyleDirty.value) {
        payload.settings.display = {
          mode: displayMode.value,
          css_selector: cssSelector.value,
          embedded_style: embeddedStyle.value,
          custom_css: customCss.value,
        }
      }
      if (isPositionDirty.value) {
        payload.settings.position = position.value
      }
      if (isIconDirty.value) {
        payload.settings.icon = iconObjectToSave.value
      }
      if (isColorsDirty.value) {
        payload.settings.colors = {
          accent_color: accentColor.value,
        }
      }
      if (originalSettings.value.ttsEnabled !== ttsEnabled.value) {
        payload.tts_enabled = ttsEnabled.value
      }
      if (originalSettings.value.ttsHighlighting !== ttsHighlighting.value) {
        payload.tts_highlighting = ttsHighlighting.value
      }
      if (originalSettings.value.polyEnabled !== polyEnabled.value) {
        payload.poly_enabled = polyEnabled.value
      }

      licenseStore
        .updateLicenseSettings(payload)
        .then((response) => {
          emit("setting-saved", response.data.data)
          successMessage.value = "Settings saved successfully!"
          showSuccessNotification.value = true
          setTimeout(() => (showSuccessNotification.value = false), 3000)
        })
        .catch((error) => {
          console.error("Error saving settings:", error)
          failMessage.value = `Failed to save settings: ${
            error.message || "Unknown error"
          }`
          showFailNotification.value = true
          setTimeout(() => (showFailNotification.value = false), 3000)
        })
    }

    async function openAccentColorPicker() {
      if (accentColorPicker.value && accentColorPicker.value.$el) {
        // The @mcistudio/vue-colorpicker component typically has an internal element
        // that triggers the popup. We try to find and click that specific element.
        // If not found, we fall back to clicking the first child.
        const trigger =
          accentColorPicker.value.$el.querySelector(".vc-color-wrap") ||
          accentColorPicker.value.$el.children[0]
         if (trigger) {
          isAccentColorPickerOpen.value = true;
          trigger.click();
          // Wait for the DOM to update after the click triggers the popup
          await nextTick();
          colorPickerPopupEl.value = accentColorPicker.value.$el.querySelector(".panel");
        }
      }
    }

    // Watch for the picker closing
    watch(isAccentColorPickerOpen, (isOpen) => {
      if (!isOpen) {
        colorPickerPopupEl.value = null;
      }
    })

    function forceAccentColorPickerUpdate() {
      accentColorPickerKey.value++
      // After a manual update, close the picker.
      isAccentColorPickerOpen.value = false;
    }

    function restoreDefaults() {
      // Reset display to hardcoded default
      displayMode.value = "floating"
      cssSelector.value = ""
      customCss.value = ""
      embeddedStyle.value = "full"

      // Reset position to hardcoded defaults
      position.value = {
        horizontal: "right",
        vertical: "bottom",
        horizontalOffset: 20,
        verticalOffset: 20,
      }

      // Reset icon to hardcoded defaults
      selectedIconId.value = "default"
      selectedIconName.value = "globe"
      iconColor.value = "#FFFFFF"
      iconSize.value = "large"
      flagIcon.value = true
      flagIconPosition.value = "floating"

      iconSize.value = "large"

      // accentTextColor.value = "white"

      // Reset accent color to hardcoded defaults
      accentColor.value = {
        mode: "linear",
        degree: 135,
        gradients: [
          { percent: 0, color: { r: 102, g: 126, b: 234, a: 1 } },
          { percent: 100, color: { r: 118, g: 75, b: 162, a: 1 } },
        ],
        css: "background-image:linear-gradient(135deg,rgba(102,126,234,1) 0%,rgba(118,75,162,1) 100%)",
      }

      // Force the color picker to re-render by changing its key
      accentColorPickerKey.value++

      // Reset TTS to hardcoded defaults
      ttsEnabled.value = false
      ttsHighlighting.value = true
      polyEnabled.value = false
    }

    function goToCheckout() {
      router.push({ name: "checkout" })
    }

    // Navigation guard - warn before leaving with unsaved changes
    onBeforeRouteLeave((to, from, next) => {
      if (hasUnsavedChanges.value) {
        const confirmLeave = confirm(
          "You have unsaved changes that will be lost. Are you sure you want to leave this page?"
        )
        if (confirmLeave) {
          next()
        } else {
          next(false)
        }
      } else {
        next()
      }
    })

    return {
      availableIcons,
      formattedIconId,
      iconObjectToSave,
      accentColorPicker,
      showSuccessNotification,
      successMessage,
      showFailNotification,
      hasUnsavedChanges,
      isPositionDirty,
      isDisplayDirty,
      isEmbeddedStyleDirty,
      isIconDirty,
      isColorsDirty,
      isTtsDirty,
      cssSelector,
      isCssSelectorValid,
      customCss,
      isCustomCssValid,
      failMessage,
      isSaving,
      iconColor,
      selectedIconName,
      iconSize,
      displayMode,
      embeddedStyle,
      position,
      selectedIconId,
      ttsEnabled,
      ttsHighlighting,
      polyEnabled,
      accentColor,
      // accentTextColor,
      isAccentColorPickerOpen,
      accentColorPickerKey,
      colorPickerPopupEl,
      currentSettings,
      flagIcon,
      defaultIconVariants,
      defaultIconPreviewSvg,
      iconBgStyle,
      flagIconPosition,
      //functions
      saveAllSettings,
      openAccentColorPicker,
      restoreDefaults,
      forceAccentColorPickerUpdate,
      goToCheckout,
      //components
      ColorPicker,
      Pencil,
      SlideInNotification,
      LivePreview,
      ManualColorInput,
    }
  },
}
</script>

<style scoped>
.display-settings-card{
  margin-top: 40px;
}
.overview-grid{
  margin-top: 1.5rem;
}
.customize-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 1rem;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reset-settings-btn {
  position: absolute;
  top: 10px;
  right: 5px;
}
.overview-card {
  display: flex;
  flex-direction: column;
}
.overview-header-fixed {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000; /* Ensure it's above other content */
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px; /* Add some padding around the button */
  background-color: var(
    --bg-primary
  ); /* Match background or make it slightly distinct */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* Add a subtle shadow */
  /* Optional: Add a subtle border if desired */
  /* border: 1px solid var(--border-color); */
}

.dirty {
  background: rgba(251, 191, 36, 0.08);
}

.dirty-header {
  position: relative; /* Needed for pseudo-element positioning */
  padding-right: 15px; /* Make space for the dot */
}

.dirty-header::after {
  content: "";
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--warning-color, #f59e0b); /* Amber-500 */
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dirty-indicator {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.simple-color-picker {
  position: relative;
  width: 100%;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  cursor: pointer;
}

.color-swatch-small {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  padding: 4px;
  display: inline-block;
}

.color-selection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  cursor: pointer;
  padding: 0.15rem 0.75rem;
}

.full-color-picker {
  width: max-content;
}

.icon-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 41px;
  height: 40px;
  border-radius: 50%;
}

.icon-bg span {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flag-settings{
}
.color-input-native {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.color-input-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  height: 100%;
  gap: 0.75rem;
}

.swatch-wrapper {
  border: 1px solid var(--border-color);
  padding: 4px;
  border-radius: 6px;
}

.color-swatch {
  width: 22px;
  height: 22px;
  display: block;
  padding: 4px;
}

.icon-bg-color-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.icon-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
  text-align: left;
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
  font-size: 0.9rem;
  text-transform: capitalize;
}

.icon-option {
  flex-direction: column;
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
  width: 100%;
  resize: none;
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

.input-error {
  border-color: var(--fail-color);
}

.error-text {
  color: var(--fail-color);
  font-size: 0.8rem;
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
  content: "";
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
  .form-row {
    grid-template-columns: 1fr;
  }
  .radio-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  .icon-radio-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}

.icon-preview img {
  width: 41px;
  height: 40px;
}

.icon-preview :deep(svg) {
  width: 29px;
  height: 29px;
}

.icon-preview :deep(svg.globe-icon) {
  stroke: v-bind(iconColor);
}

.icon-preview :deep(svg.translate-icon) {
  fill: v-bind(iconColor);
}

.icon-preview :deep(svg.text-to-speech-icon) {
  fill: v-bind(iconColor);
}

.icon-preview :deep(svg.ear-sound-icon) {
  fill: v-bind(iconColor);
}

.icon-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
}

.mode-buttons {
  display: flex;
  gap: 0.5rem;
}

.preview-panel {
  position: sticky;
  top: 20px; /* Adjust as needed based on your header height */
  grid-column: span 2;
}

.live-preview-container {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-primary);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.iframe-wrapper {
  flex-grow: 1;
  overflow: hidden;
  border-radius: 0 0 8px 8px;
}

.iframe-wrapper iframe {
  width: 100%;
  height: 100%;
  border: none;
}
/* hide ColorPicker's radial gradient option */
:deep(.btn-active-mode.radial){
  display: none;
}

/* TTS upgrade prompt for free tier */
.tts-upgrade-prompt {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  border: 1px dashed rgba(102, 126, 234, 0.3);
}

.tts-upgrade-prompt .upgrade-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
}
</style>
