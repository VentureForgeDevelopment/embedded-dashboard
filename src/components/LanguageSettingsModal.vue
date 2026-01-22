<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Manage Languages</h3>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <div v-if="license" class="settings-form">
          <div class="form-section">
            <div class="form-group">
              <LanguageSelect
                v-model="selectedLanguages"
                :language-limit="languageLimit"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal" :disabled="isSaving">
          Cancel
        </button>
        <button class="btn btn-primary" @click="saveLanguages" :disabled="isSaving">
          {{ isSaving ? "Saving..." : "Save Languages" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import LanguageSelect from "./LanguageSelect.vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  license: {
    type: Object,
    default: null,
  },
  isSaving: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(["close", "save"]);

const selectedLanguages = ref([]);

const languageLimit = computed(() => {
  if (props.license?.type === "manual") {
    return 25;
  }
  let limit = 1; //handles free licenses
  if (props.license?.product) {
    const subType = props.license.product.toLowerCase();
    if (subType.includes("starter")) limit = 1;
    if (subType.includes("growth")) limit = 3;
    if (subType.includes("pro")) limit = 5;
  }
  return limit;
});

watch(
  () => props.license,
  (newLicense) => {
    if (newLicense) {
      const settings = newLicense.settings || {};
      selectedLanguages.value = settings.languages || [{ code: "en", name: "English" }];
    }
  },
  { immediate: true, deep: true }
);

const closeModal = () => {
  emit("close");
};

const saveLanguages = async () => {
  if (!props.license) return;

  // Scrub the 'flag' property from each language object to avoid saving large SVG strings
  // to the database. The flags are fetched on-demand when needed.
  const scrubbedLanguages = selectedLanguages.value.map(({ flag, ...rest }) => rest);

  emit("save", scrubbedLanguages);
};
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
  display: flex;
  flex-direction: column;
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

.modal-header {
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
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.modal-body {
  padding: 2rem;
  flex-grow: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
}

</style>
