<template>
  <div class="live-preview-wrapper">
    <MockToolbar
      v-if="license.settings && license.settings.display.mode === 'floating'"
      :settings="license.settings"
      :available-icons="licenseStore.state.icons"
    />
    <MockEmbeddedToolbar
      v-if="
        license.settings && license.settings.display.mode === 'embedded'
      "
      :settings="license.settings"
    />
    <div class="preview-overlay">
      <div class="overlay-content">
        <AlertCircleOutline
          v-if="isToolbarHidden || isIconHiddenByFlag"
          fill-color="#facc15"
        />
        <p class="overlay-text">{{ overlayText }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue"
import { useLicenseStore } from "../../stores/license"
import MockToolbar from "./MockToolbar.vue"
import MockEmbeddedToolbar from "./MockEmbeddedToolbar.vue"
import AlertCircleOutline from "vue-material-design-icons/AlertCircleOutline.vue"


export default {
  name: "LivePreview",
  components: { MockToolbar, MockEmbeddedToolbar, AlertCircleOutline },
  props: {
    license: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const licenseStore = useLicenseStore()
    
    const isToolbarHidden = computed(
      () => props.license.settings?.icon?.id === "no_icon"
    )

    const isIconHiddenByFlag = computed(() => {
      const iconSettings = props.license.settings?.icon
      if (!iconSettings) return false

      return (
        iconSettings.id === "default" &&
        iconSettings.flag_icon_position === "center" &&
        iconSettings.flag_icon
      )
    })

    const overlayText = computed(() => {
      if (props.license.settings?.display?.mode === "embedded") {
        return "This is a preview of the embedded toolbar. It will appear on your website inside the element targeted by your CSS selector.";
      }
      if (isToolbarHidden.value && props.license.settings?.display?.mode === 'floating') {
        return "When the 'No Icon' option is selected, the toolbar will not be visible on your website."
      }
      if (isIconHiddenByFlag.value && props.license.settings?.display?.mode === 'floating') {
        return "When the flag is centered, the icon is hidden."
      }
      return "This is a preview of the toolbar. It will appear on your website based on your position settings."
    })

    return { licenseStore, overlayText, isToolbarHidden, isIconHiddenByFlag }
  },
}
</script>

<style scoped>
.live-preview-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  background-image: repeating-linear-gradient(
      45deg,
      var(--bg-secondary) 25%,
      transparent 25%,
      transparent 75%,
      var(--bg-secondary) 75%,
      var(--bg-secondary)
    ),
    repeating-linear-gradient(
      45deg,
      var(--bg-secondary) 25%,
      var(--bg-primary) 25%,
      var(--bg-primary) 75%,
      var(--bg-secondary) 75%,
      var(--bg-secondary)
    );
  background-position: 0 0, 10px 10px;
  background-size: 20px 20px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* Allows clicks to pass through if needed */
}

.overlay-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  max-width: 80%;
}

.overlay-text {
  text-align: center;
  font-size: 0.9rem;
  margin: 0;
}
</style>
