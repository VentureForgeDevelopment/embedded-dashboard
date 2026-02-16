<template>
  <div>
    <div class="language-select-wrapper section-content">
      <div class="languages-selection-wrapper">
        <div v-if="showLanguageWarning" class="language-limit-reached">
          <p v-if="initialOnboardComplete">Language Limit Reached</p>
        </div>
        <LlInput
          v-model="languageSearch"
          placeholder="Search languages..."
          style="margin-bottom: 1rem"
        />
        <LlSelect
          v-model="selectedLanguages"
          label="Language Selection"
          id="language_select"
          name="language_select"
          multiple
          :class="[{ 'has-tooltip': showLanguageWarning }]"
        >
          <option
            v-for="language in filteredLanguages"
            :key="language.code"
            :value="language"
            :aria-label="language.name + language.code"
            :aria-selected="
              selectedLanguages.some((l) => l.code === language.code)
            "
            :aria-checked="
              selectedLanguages.some((l) => l.code === language.code)
            "
            :class="{
              'is-selected': selectedLanguages.some(
                (l) => l.code === language.code,
              ),
            }"
            :disabled="
              selectedLanguages.length >= languageLimit &&
              !selectedLanguages.some((l) => l.code === language.code)
            "
          >
            <span>
              {{ language.name }}
            </span>
            <span> ({{ language.code }}) </span>
          </option>
        </LlSelect>
        <p class="language-select-assurance-msg">
          Start with your most important audience. You can add more languages
          anytime.
        </p>
        <span
          v-if="showLanguageWarning"
          class="tooltip-container"
          data-tooltip="Language Limit Reached"
        ></span>
      </div>

      <div class="selected-languages-wrapper">
        <p v-if="!initialOnboardComplete">
          <span v-if="showLanguageWarning" class="single-language-warning">Starter plan includes 1 language</span>
          <span v-if="selectedLanguages.length"> 1 Language Selected </span>
          <span v-else> 0 Languages Selected </span>
        </p>
        <p v-else>
          {{ selectedLanguages.length }}/{{ languageLimit }} Languages Selected
        </p>
        <div
          v-show="selectedLanguages.length"
          class="selected-languages-display"
        >
          <ul>
            <li v-for="language in selectedLanguages" :key="language.code">
              {{ language.code }}
              <span
                v-if="language.flag"
                v-html="language.flag"
                class="flag-icon"
              >
              </span>
              <span class="icon-wrapper">
                <Close
                  class="close-icon"
                  @click="removeSelectedLanguage(language)"
                />
              </span>
            </li>
          </ul>
        </div>
        <button
          v-if="showSaveBtn"
          @click="$emit('save')"
          :class="[
            'btn',
            'btn-primary',
            { 'btn-disabled': selectedLanguages.length === 0 },
          ]"
          :disabled="selectedLanguages.length === 0"
        >
        <span v-if="!initialOnboardComplete">Continue to Activation</span>
        <span v-else>Save</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue"
import LlInput from "../components/Root/Input/LlInput.vue"
import LlSelect from "../components/Root/Select/LlSelect.vue"
import Close from "vue-material-design-icons/Close.vue"
import { useLanguageStore } from "../stores/language"

export default {
  name: "LanguageSelect",
  components: {
    LlInput,
    LlSelect,
    Close,
  },
  props: {
    modelValue: {
      type: Array,
      required: true,
    },
    languageLimit: {
      type: Number,
      required: true,
    },
    showSaveBtn: {
      type: Boolean,
      default: false,
    },
    initialOnboardComplete: {
      type: Boolean,
      required: false,
    },
  },
  emits: ["update:modelValue", "save"],
  setup(props, { emit }) {
    const languageStore = useLanguageStore()
    const languages = computed(() => languageStore.allLanguages)

    const languageSearch = ref("")

    const selectedLanguages = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    })

    const filteredLanguages = computed(() => {
      if (!languageSearch.value) {
        return languages.value
      }
      const search = languageSearch.value.toLowerCase()
      return languages.value.filter(
        (language) =>
          // Ensure language and its properties are not null
          (language &&
            language.name &&
            language.code &&
            language.name.toLowerCase().includes(search)) ||
          language.code.toLowerCase().includes(search),
      )
    })

    const isLanguageLimitReached = computed(() => {
      return (
        props.languageLimit > 0 &&
        selectedLanguages.value.length >= props.languageLimit
      )
    })

    const showLanguageWarning = computed(() => {
      return isLanguageLimitReached.value
    })

    function removeSelectedLanguage(language) {
      selectedLanguages.value = selectedLanguages.value.filter(
        (l) => l.code !== language.code,
      )
    }

    onMounted(() => {
      languageStore.fetchSupportedLanguages()
    })

    return {
      languageSearch,
      selectedLanguages,
      filteredLanguages,
      isLanguageLimitReached,
      showLanguageWarning,
      removeSelectedLanguage,
    }
  },
}
</script>

<style scoped>
.language-select-wrapper {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 65% 35%;
}
.language-select-assurance-msg {
  font-size: 0.75rem;
  font-weight: 400;
  color: #212529;
  text-align: left;
  margin: 0.5rem 0;
}
.section-container-collapsed .language-select-wrapper {
  margin-top: 0;
}

select option {
  margin: 0 !important;
}

:deep(#language_select .is-selected) {
  /* Note: Styling of <option> elements is inconsistent across browsers. This works well in Firefox. */
  background-color: var(--accent-color) !important;
  color: #F4F016;
  font-weight: 600;
}

.language-limit-reached {
  font-size: 0.9em;
  color: var(--accent-color);
}
.single-language-warning{
  font-size: 0.9em;
  display: block;
  color: black;
  font-weight:400;
  font-size:14px;
}
.selected-languages-wrapper {
  padding: 0 20px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.selected-languages-wrapper p {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
}
.selected-languages-display {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: white;
  text-align: center;
  align-self: center;
  color: #212529;
  max-height: 200px;
  overflow-y: auto;
  min-width: 200px;
}
.selected-languages-display ul {
  padding-left: 20px;
  margin: 0.5rem 0 0 0;
  list-style: none;
}
.selected-languages-display ul li {
  text-align: left;
  display: inline-flex;
  justify-content: flex-start;
  margin-right: 20px;
  margin-bottom: 15px;
  padding: 5px 10px;
  background: #ddd;
  border-radius: 20px;
}
.flag-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: auto;
  margin-left: 5px;
}
svg {
  width: 30px !important;
  height: 20px !important;
}
.language-limit-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-align: left;
}

@media screen and (max-width: 769px) {
  .language-select-wrapper {
    grid-template-columns: 1fr;
  }
  .selected-languages-wrapper {
    margin-top: 2rem;
  }
}
</style>
