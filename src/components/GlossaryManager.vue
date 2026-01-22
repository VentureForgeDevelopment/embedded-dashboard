<template>
  <div class="glossary-container" :class="{ 'is-loading': loading }">
    <SlideInNotification
      :show="showSuccessNotification"
      message="Success!"
      type="success"
    />
    <SlideInNotification
      :show="showFailNotification"
      message="Failure.."
      type="error"
    />
    <SlideInNotification
      :show="showGenericFailNotification"
      message="An error occurred. Please try again later."
      type="error"
    />

    <div class="glossary-header">
      <h3 class="section-title">Glossary Rules</h3>
      <p class="glossary-description">
        Define glossary rules to exclude specific keywords from translation or
        replace them with a set term. Exclusions can be global (for all
        languages) or language-specific. Replacements must specify a target
        language.
      </p>
    </div>

    <!-- Language-Specific Rules Section -->
    <div class="language-rules-section">
      <div class="filter-bar">
        <div class="filter-group">
          <div class="filter-header">
            <div class="filter-label">Filter by Language:</div>
          </div>
          <div class="filter-tags">
            <button
              class="btn btn-outline btn-small"
              :class="{ active: showGlobal }"
              @click="toggleGlobalFilter"
            >
              <span v-html="globalIcon" class="lang-flag"></span>
              Global Rules
            </button>
            <button
              v-for="lang in availableLanguages"
              :key="lang.code"
              class="btn btn-outline btn-small"
              :class="{
                active: isLanguageSelected(lang.code),
                inactive: !lang.isActive,
              }"
              @click="toggleLanguageFilter(lang.code)"
            >
              <span
                v-if="lang.flag"
                v-html="lang.flag"
                class="lang-flag"
              ></span>
              {{ lang.name }}
              <span v-if="!lang.isActive" class="inactive-badge">inactive</span>
            </button>
          </div>
          <div v-if="hasInactiveLanguageSelected" class="language-warning">
            ⚠️ One or more selected languages are not currently active on your
            toolbar
          </div>
        </div>
      </div>

      <div class="rule-type-filter-bar">
        <div class="rule-type-label">Rule Type:</div>
        <div class="rule-type-buttons">
          <button
            class="btn btn-outline btn-small"
            :class="{ active: ruleTypeFilter === 'all' }"
            @click="ruleTypeFilter = 'all'"
          >
            All Types
          </button>
          <button
            class="btn btn-outline btn-small"
            :class="{ active: ruleTypeFilter === 'exclude' }"
            @click="ruleTypeFilter = 'exclude'"
          >
            Exclusions
          </button>
          <button
            class="btn btn-outline btn-small"
            :class="{ active: ruleTypeFilter === 'replace' }"
            @click="ruleTypeFilter = 'replace'"
          >
            Replacements
          </button>
        </div>
      </div>

      <div class="search-and-stats">
        <div class="search-box">
          <button class="btn btn-primary btn-small" @click="addRule">
            <Plus
              size="20"
              style="
                display: flex;
                justify-content: center;
                align-items: center;
              "
            />
            Add Rule
          </button>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search rules..."
            class="search-input"
          />
        </div>
        <div class="filter-stats">
          Showing {{ paginatedRules.length }} of
          {{ searchFilteredRules.length }} rules
        </div>
      </div>

      <div class="glossary-table-wrapper">
        <table class="glossary-table">
          <thead>
            <tr>
              <th>Keyword/Phrase</th>
              <th>Rule Type</th>
              <th>Language/Scope</th>
              <th>Replacement</th>
              <th class="action-column"></th>
            </tr>
          </thead>
          <tbody class="glossary-tbody">
            <TransitionGroup name="rule-row" tag="fragment">
              <tr
                v-for="(rule, index) in paginatedRules"
                :key="rule.id"
                class="rule-item"
                :class="{
                  'is-new': rule.is_new,
                  'is-unsaved': !rule.is_saved || rule.is_dirty,
                  'has-errors': ruleErrors[rule.id],
                }"
              > 
                <td data-label="Keyword/Phrase">
                  <LlInput
                    label="Keyword/Phrase"
                    placeholder="e.g. BrandName"
                    v-model="rule.source_phrase"
                    :id="`source_phrase_${rule.id}`"
                    @update:modelValue="markAsDirty(rule)"
                    :class="{ 'has-error': ruleErrors[rule.id]?.source_phrase }"
                    :disabled="ruleSavingStates[rule.id]"
                  />
                  <div
                    v-if="ruleErrors[rule.id]?.source_phrase"
                    class="error-message"
                  >
                    {{
                      Array.isArray(ruleErrors[rule.id].source_phrase)
                        ? ruleErrors[rule.id].source_phrase[0]
                        : ruleErrors[rule.id].source_phrase
                    }}
                  </div>
                </td>
                <td data-label="Rule Type">
                  <select
                    class="form-select"
                    v-model="rule.type"
                    @change="onTypeChange(rule)"
                    :class="{ 'has-error': ruleErrors[rule.id]?.type }"
                    :disabled="ruleSavingStates[rule.id]"
                  >
                    <option value="exclude">Exclude</option>
                    <option value="replace">Replace with</option>
                  </select>
                  <div v-if="ruleErrors[rule.id]?.type" class="error-message">
                    {{
                      Array.isArray(ruleErrors[rule.id].type)
                        ? ruleErrors[rule.id].type[0]
                        : ruleErrors[rule.id].type
                    }}
                  </div>
                </td>
                <td data-label="Language/Scope">
                  <LanguageScopeDropdown
                    v-model="rule.target_language"
                    :rule-type="rule.type"
                    :available-languages="[
                      { code: 'global', name: 'All Languages' },
                      ...availableLanguages,
                    ]"
                    @update:modelValue="onLanguageChange(rule)"
                    :class="{
                      'has-error': ruleErrors[rule.id]?.target_language,
                    }"
                    :disabled="ruleSavingStates[rule.id]"
                  />
                  <div
                    v-if="ruleErrors[rule.id]?.target_language"
                    class="error-message"
                  >
                    {{
                      Array.isArray(ruleErrors[rule.id].target_language)
                        ? ruleErrors[rule.id].target_language[0]
                        : ruleErrors[rule.id].target_language
                    }}
                  </div>
                </td>
                <td
                  data-label="Replacement"
                  :class="{ 'is-not-replacement': rule.type !== 'replace' }"
                >
                  <LlInput
                    v-if="rule.type === 'replace'"
                    label="Replacement Phrase *"
                    placeholder="e.g. NombreDeMarca"
                    v-model="rule.target_phrase"
                    :id="`target_phrase_${rule.id}`"
                    @update:modelValue="markAsDirty(rule)"
                    :class="{ 'has-error': ruleErrors[rule.id]?.target_phrase }"
                    :disabled="ruleSavingStates[rule.id]"
                  />
                  <div
                    v-if="ruleErrors[rule.id]?.target_phrase"
                    class="error-message"
                  >
                    {{
                      Array.isArray(ruleErrors[rule.id].target_phrase)
                        ? ruleErrors[rule.id].target_phrase[0]
                        : ruleErrors[rule.id].target_phrase
                    }}
                  </div>
                </td>
                <td class="action-column">
                  <button
                    v-if="rule.is_dirty"
                    class="btn btn-outline btn-undo"
                    @click="undoChanges(rule)"
                    :disabled="ruleSavingStates[rule.id]"
                    title="Undo Changes"
                  >
                    <Undo
                      style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      "
                    />
                  </button>

                  <button
                    v-if="!rule.is_saved || rule.is_dirty"
                    class="btn btn-outline"
                    @click="saveRule(rule)"
                    :disabled="ruleErrors[rule.id] || ruleSavingStates[rule.id]"
                    :title="
                      ruleSavingStates[rule.id]
                        ? 'Saving...'
                        : ruleErrors[rule.id]
                        ? 'Fix validation errors first'
                        : 'Save Rule'
                    "
                  >
                    <Save
                      v-if="!ruleSavingStates[rule.id]"
                      style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      "
                    />
                    <span
                      v-else
                      style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      "
                    >
                      ⏳
                    </span>
                  </button>

                  <button
                    class="btn btn-outline btn-delete"
                    @click="removeRule(rule, index)"
                    :disabled="ruleSavingStates[rule.id]"
                    title="Delete Rule"
                  >
                    <Close
                      class="delete-icon"
                      style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      "
                    />
                    <span class="delete-text">Delete</span>
                  </button>
                </td>
              </tr>
            </TransitionGroup>
            <tr v-if="searchFilteredRules.length === 0">
              <td colspan="5">
                <p class="empty-state">
                  {{
                    localRules.length === 0
                      ? "No glossary rules have been added yet."
                      : "No rules match the current filter."
                  }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="searchFilteredRules.length > itemsPerPage" class="pagination">
        <button
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="currentPage = 1"
        >
          First
        </button>
        <button
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          Previous
        </button>
        <span class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Next
        </button>
        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage = totalPages"
        >
          Last
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, computed, watch } from "vue"
import { onBeforeRouteLeave } from "vue-router"
import { useLicenseStore } from "../stores/license"
import LlInput from "./Root/Input/LlInput.vue"
import SlideInNotification from "./SlideInNotification.vue"
import LanguageScopeDropdown from "./LanguageScopeDropdown.vue"
import Plus from "vue-material-design-icons/Plus.vue"
import Save from "vue-material-design-icons/ContentSave.vue"
import Close from "vue-material-design-icons/Close.vue"
import Undo from "vue-material-design-icons/Undo.vue"

const licenseStore = useLicenseStore()

const props = defineProps({
  license_id: {
    type: String,
    required: true,
  },
  license: {
    type: Object,
    required: false,
    default: null,
  },
})

const globalIcon = computed(() => {
  const defaultIconSet = licenseStore.state.icons.find(
    (i) => i.id === "default"
  )
  if (defaultIconSet) {
    const globeVariant = defaultIconSet.variants.find((v) => v.name === "globe")
    if (globeVariant) {
      return globeVariant.data
    }
  }
  //fallback
  return '<svg xmlns="http://www.w3.org/2000/svg" class="icon globe-icon" width="24" height="24" viewBox="0 0 420 420" stroke="black" fill="none"><path stroke-width="26" d="M209,15a195,195 0 1,0 2,0z"/><path stroke-width="26" d="m210,15v390m195-195H15M59,90a260,260 0 0,0 302,0 m0,240 a260,260 0 0,0-302,0M195,20a250,250 0 0,0 0,382 m30,0 a250,250 0 0,0 0-382"/></svg>' // Fallback emoji
})

// All possible languages (reference list with names)
const allLanguages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "cs", name: "Czech" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
]

// Get current license from prop or store
const currentLicense = computed(() => {
  // First try to use the license passed as prop
  if (props.license) {
    return props.license
  }

  // Fall back to store if available
  if (!licenseStore.state.licenses) return null
  return licenseStore.state.licenses.find(
    (l) => l.id === parseInt(props.license_id)
  )
})

// Get toolbar-configured languages (normalize locale codes to base codes)
const toolbarLanguages = computed(() => {
  if (!currentLicense.value?.settings?.languages) return []
  return currentLicense.value.settings.languages.map((lang) => {
    // Extract base language code (e.g., "en-us" -> "en", "fr-fr" -> "fr")
    const code = lang.code || lang
    return code.split("-")[0].toLowerCase()
  })
})

const localRules = ref([])
const ruleErrors = ref([])
const ruleSavingStates = ref({}) // Track which rules are currently saving
const showGlobal = ref(false)
const selectedLanguages = ref(new Set()) // For multi-select of individual languages
const ruleTypeFilter = ref("all") // Can be 'all', 'exclude', or 'replace'
const showAll = computed(
  () => !showGlobal.value && selectedLanguages.value.size === 0
)
const searchQuery = ref("") // Search input
const currentPage = ref(1) // Current page for pagination
const itemsPerPage = ref(10) // Items per page

const showSuccessNotification = ref(false)
const showFailNotification = ref(false)
const showGenericFailNotification = ref(false)

// availableLanguages is now a ref to handle async enrichment
const availableLanguages = ref([])

// Watch for changes that affect available languages and enrich them
watch(
  [toolbarLanguages, localRules],
  async () => {
    const languageCodes = new Set()

    // Add toolbar-configured languages (excluding English)
    toolbarLanguages.value.forEach((code) => {
      if (code !== "en") {
        languageCodes.add(code)
      }
    })

    // Add languages from existing rules (excluding English)
    localRules.value.forEach((rule) => {
      if (
        rule.target_language &&
        rule.target_language !== "en" &&
        rule.target_language !== "global"
      ) {
        languageCodes.add(rule.target_language)
      }
    })

    // Map to basic language objects
    const baseLanguages = Array.from(languageCodes).map((code) => {
      const langInfo = allLanguages.find((l) => l.code === code)
      return {
        code,
        name: langInfo?.name || code.toUpperCase(),
        isActive: toolbarLanguages.value.includes(code),
      }
    })

    // Enrich with flags and localized names
    const enriched = await licenseStore.enrichLanguages(baseLanguages)

    // Sort and update the ref
    availableLanguages.value = enriched.sort((a, b) => {
      // Sort active languages first, then alphabetically
      if (a.isActive && !b.isActive) return -1
      if (!a.isActive && b.isActive) return 1
      return a.name.localeCompare(b.name)
    })
  },
  { deep: true, immediate: true }
)
const loading = computed(() => {
  return licenseStore.state.loading.license_rules
})

// Handle filter selection
const selectAllLanguages = () => {
  // Resets all filters
  showGlobal.value = false
  selectedLanguages.value.clear()
}

const toggleGlobalFilter = () => {
  showGlobal.value = !showGlobal.value
}

const toggleLanguageFilter = (langCode) => {
  if (selectedLanguages.value.has(langCode)) {
    selectedLanguages.value.delete(langCode)
  } else {
    selectedLanguages.value.add(langCode)
  }
}

const isLanguageSelected = (langCode) => {
  return selectedLanguages.value.has(langCode)
}

const filteredRules = computed(() => {
  let filtered = []

  if (showAll.value) {
    filtered = localRules.value
  } else {
    // Combined filter logic
    filtered = localRules.value.filter((rule) => {
      const isGlobalMatch = showGlobal.value && rule.global_rule
      const isLanguageMatch = selectedLanguages.value.has(rule.target_language)
      return isGlobalMatch || isLanguageMatch
    })
  }

  // Step 2: Further filter by rule type (exclusions/replacements)
  if (ruleTypeFilter.value === "exclude") {
    filtered = filtered.filter((rule) => rule.type === "exclude")
  } else if (ruleTypeFilter.value === "replace") {
    filtered = filtered.filter((rule) => rule.type === "replace")
  }

  return filtered
})

// Apply search filter
const searchFilteredRules = computed(() => {
  if (!searchQuery.value.trim()) {
    return filteredRules.value
  }

  const query = searchQuery.value.toLowerCase()
  return filteredRules.value.filter((rule) => {
    return (
      rule.source_phrase?.toLowerCase().includes(query) ||
      rule.target_phrase?.toLowerCase().includes(query) ||
      rule.type?.toLowerCase().includes(query) ||
      rule.target_language?.toLowerCase().includes(query)
    )
  })
})

// Calculate total pages
const totalPages = computed(() => {
  return Math.ceil(searchFilteredRules.value.length / itemsPerPage.value)
})

// Get paginated rules
const paginatedRules = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return searchFilteredRules.value.slice(start, end)
})

// Reset to page 1 when filters change
watch(
  [searchQuery, showGlobal, selectedLanguages, ruleTypeFilter, localRules],
  () => {
    currentPage.value = 1
  }
)

// Check if any selected language is inactive
const hasInactiveLanguageSelected = computed(() => {
  for (const langCode of selectedLanguages.value) {
    if (!toolbarLanguages.value.includes(langCode)) {
      return true
    }
  }
  return false
})

const validateRule = (rule) => {
  const errors = {}
  const disallowedChars = /[<>{}]/

  if (!rule.source_phrase.trim()) {
    errors.source_phrase = "Keyword/Phrase is required."
  } else if (disallowedChars.test(rule.source_phrase)) {
    errors.source_phrase = "Contains disallowed characters like < > { }."
  }

  // Global rules must be of type 'exclude'
  if (rule.target_language === "global" && rule.type !== "exclude") {
    // This is handled by onLanguageChange, but as a safeguard:
    errors.type = "Global rules must be exclusions."
  }

  if (rule.type === "replace") {
    if (!rule.target_phrase.trim()) {
      errors.target_phrase = "Replacement phrase is required."
    } else if (disallowedChars.test(rule.target_phrase)) {
      errors.target_phrase = "Contains disallowed characters like < > { }."
    }

    // Replacements MUST have a target language
    if (!rule.target_language) {
      errors.target_language = "Target language is required for replacements."
    }
  }

  // Language-specific exclusions need a target language (but not global ones)
  if (rule.type === "exclude" && !rule.target_language) {
    errors.target_language =
      "Target language is required for language-specific exclusions."
  }

  if (Object.keys(errors).length > 0) {
    ruleErrors.value[rule.id] = errors
    console.error("Validation errors:", errors)
    return false
  }

  delete ruleErrors.value[rule.id]
  return true
}

// Watch for changes from the store and update local state
watch(
  () => licenseStore.state.license_rules,
  (newRules) => {
    // Create a map of existing local rules for quick lookup
    const localRulesMap = new Map(
      localRules.value.map((rule) => [rule.id, rule])
    )

    // When rules are fetched from the store, they are considered "saved".
    // But we need to preserve local modifications (dirty rules)
    const savedRules = newRules.map((rule) => {
      const localRule = localRulesMap.get(rule.id)

      // If local rule exists and is dirty, keep the local version to preserve edits
      if (localRule && localRule.is_dirty) {
        return localRule
      }

      const isGlobal = rule.global_rule === true || rule.global_rule === 1

      // Otherwise, use the rule from the store (it's been saved or freshly loaded)
      return {
        ...rule,
        is_saved: true,
        is_dirty: false,
        // Ensure boolean values
        global_rule: isGlobal,
        // If it's a global rule, set the target_language for the dropdown to 'global'.
        // The backend stores this as `null`, but the UI needs 'global' to select the
        // correct option in the dropdown.
        target_language: isGlobal ? "global" : rule.target_language,
      }
    })

    // Keep unsaved rules (new rules not yet saved to the store)
    const unsavedRules = localRules.value.filter((rule) => !rule.is_saved)
    localRules.value = [...unsavedRules, ...savedRules]
  },
  { deep: true, immediate: true }
)

const addRule = () => {
  // Determine the default type based on current filter
  // If user is filtering by a specific rule type, create that type
  let defaultType = "exclude"
  if (ruleTypeFilter.value === "replace") {
    defaultType = "replace"
  } else if (ruleTypeFilter.value === "exclude") {
    defaultType = "exclude"
  }

  // Determine the default target language based on current filter
  // If user is filtering by a single language, pre-populate with that language
  let defaultTargetLanguage = "global"
  if (selectedLanguages.value.size === 1) {
    // Get the single selected language
    defaultTargetLanguage = Array.from(selectedLanguages.value)[0]
  }

  // Add a new language-specific rule to the top of the local list
  const newRule = {
    id: `new_${Date.now()}`, // temporary unique key
    source_phrase: "",
    type: defaultType,
    target_phrase: "",
    target_language: showGlobal.value ? "global" : defaultTargetLanguage,
    global_rule: showGlobal.value, // Set based on filter state
    is_saved: false, // Flag to identify new rules
    is_new: true, // Flag for animation
  }
  localRules.value.unshift(newRule)

  // Remove animation flag after animation completes
  setTimeout(() => {
    newRule.is_new = false
  }, 1500)
}

const onTypeChange = (rule) => {
  // When switching to "replace", clear target_language to force selection
  if (rule.type === "replace") {
    rule.target_language = ""
  }
  // When switching to "exclude", also clear target_language
  if (rule.type === "exclude") {
    rule.target_language = ""
  }
  markAsDirty(rule)
  // Validate immediately on type change
  validateRule(rule)
}

const onLanguageChange = (rule) => {
  if (rule.target_language === "global") {
    rule.type = "exclude"
    rule.target_phrase = ""
    rule.global_rule = true
  } else {
    rule.global_rule = false
  }

  markAsDirty(rule)
  // Validate immediately on language change
  validateRule(rule)
}

const markAsDirty = (rule) => {
  if (rule.is_saved && !rule.is_dirty) {
    // First time marking as dirty - store original values for undo
    rule.original_values = {
      source_phrase: rule.source_phrase,
      type: rule.type,
      target_phrase: rule.target_phrase,
      target_language: rule.target_language,
      global_rule: rule.global_rule,
    }
  }
  if (rule.is_saved) {
    rule.is_dirty = true
  }
  // Validate immediately on any field change
  validateRule(rule)
}

const undoChanges = (rule) => {
  if (rule.original_values) {
    // Restore original values
    rule.source_phrase = rule.original_values.source_phrase
    rule.type = rule.original_values.type
    rule.target_phrase = rule.original_values.target_phrase
    ;(rule.target_language = rule.original_values.target_language),
      (rule.global_rule = rule.original_values.global_rule)

    // Clear dirty state
    rule.is_dirty = false
    delete rule.original_values
  }
}

const saveRule = (rule) => {
  // Clear any previous errors for this rule
  delete ruleErrors.value[rule.id]

  if (!validateRule(rule)) {
    // Frontend validation failed - errors already stored in ruleErrors
    return // Stop if validation fails
  }

  // Set saving state to true
  ruleSavingStates.value[rule.id] = true

  const isGlobal = rule.target_language === "global"

  const payload = {
    license_id: props.license_id,
    source_phrase: rule.source_phrase,
    type: isGlobal ? "exclude" : rule.type,
    target_phrase: isGlobal ? "" : rule.target_phrase,
    target_language: isGlobal ? null : rule.target_language || null,
    global_rule: isGlobal,
    is_active: true,
  }

  if (rule.is_saved) {
    // Update existing rule
    licenseStore
      .updateLicenseRule({
        license_id: props.license_id,
        rule_id: rule.id,
        source_phrase: rule.source_phrase,
        ...payload,
      })
      .then(() => {
        rule.is_dirty = false
        delete ruleErrors.value[rule.id] // Clear any errors
        ruleSavingStates.value[rule.id] = false // Clear saving state
        showSuccessNotification.value = true
        setTimeout(() => {
          showSuccessNotification.value = false
        }, 2000)
      })
      .catch((error) => {
        console.error("Failed to update rule:", error)

        ruleSavingStates.value[rule.id] = false // Clear saving state

        // Check if this is an API validation error
        if (
          error.response &&
          error.response.data &&
          error.response.data.details
        ) {
          // Store API validation errors
          ruleErrors.value[rule.id] = error.response.data.details
        } else {
          // Generic error
          showFailNotification.value = true
          setTimeout(() => {
            showFailNotification.value = false
          }, 2000)
        }
      })
  } else {
    // Create new rule
    licenseStore
      .addLicenseRule(payload)
      .then(() => {
        delete ruleErrors.value[rule.id] // Clear any errors
        ruleSavingStates.value[rule.id] = false // Clear saving state
        showSuccessNotification.value = true
        setTimeout(() => {
          showSuccessNotification.value = false
        }, 2000)
        // The watcher will add the saved rule from the store.
        // We now explicitly remove the temporary local rule that was just saved.
        const index = localRules.value.findIndex((r) => r.id === rule.id)
        if (index > -1) {
          localRules.value.splice(index, 1)
        }
      })
      .catch((error) => {
        console.error("Failed to save rule:", error)

        ruleSavingStates.value[rule.id] = false // Clear saving state

        // Check if this is an API validation error
        if (
          error.response &&
          error.response.data &&
          error.response.data.details
        ) {
          // Store API validation errors
          ruleErrors.value[rule.id] = error.response.data.details
        } else {
          // Generic error
          showFailNotification.value = true
          setTimeout(() => {
            showFailNotification.value = false
          }, 2000)
        }
      })
  }
}

const removeRule = (rule, index) => {
  // Confirm deletion
  const ruleType = rule.type === "replace" ? "replacement" : "exclusion"
  const confirmMessage = `Are you sure you want to delete this ${ruleType} rule for "${
    rule.source_phrase || "this keyword"
  }"?`

  if (!confirm(confirmMessage)) {
    return // User cancelled
  }

  if (rule.is_saved) {
    // Call store action to delete from backend
    licenseStore
      .deleteLicenseRule({
        license_id: props.license_id,
        rule_id: rule.id,
      })
      .then(() => {
        showSuccessNotification.value = true
        setTimeout(() => {
          showSuccessNotification.value = false
        }, 2000)
      })
      .catch((error) => {
        console.error("Failed to delete rule:", error)
        showFailNotification.value = true
        setTimeout(() => {
          showFailNotification.value = false
        }, 2000)
      })
  } else {
    // Just remove the unsaved rule from the local array
    localRules.value.splice(index, 1)
  }
}

onMounted(() => {
  licenseStore.getLicenseRules({
    license_id: props.license_id,
  })
})

// Check if there are unsaved changes
const hasUnsavedChanges = computed(() => {
  return localRules.value.some((rule) => !rule.is_saved || rule.is_dirty)
})

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
</script>

<style scoped>
.glossary-container {
  position: relative;
  padding: 0.5rem;
}
.glossary-container.is-loading {
  opacity: 0.6;
  pointer-events: none;
}
.glossary-header {
  margin-bottom: 1.5rem;
  gap: 1rem;
}
.glossary-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
  max-width: 600px;
  text-align: left;
}

.lang-flag {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: auto;
  margin-right: 8px;
  border-radius: 2px;
  overflow: hidden;
}

/* Language Rules Section */
.language-rules-section {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.filter-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1rem;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.global-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.toggle-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--border-color);
  border-radius: 12px;
  transition: background-color 0.3s ease;
  cursor: pointer;
}

.toggle-switch.active {
  background: var(--accent-color);
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-slider {
  transform: translateX(20px);
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Override for active state on filter buttons - keep outlined */
.filter-tags .btn-outline.active {
  border-color: var(--accent-color);
  color: var(--accent-color);
  font-weight: 600;
  background: rgba(102, 126, 234, 0.05);
}

.filter-tags .btn-outline.inactive {
  opacity: 0.75;
}

.inactive-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.filter-tags .btn-outline.active .inactive-badge {
  background: rgba(102, 126, 234, 0.2);
}

.language-warning {
  font-size: 0.75rem;
  color: #f59e0b;
  background: #fef3c7;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #fde68a;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.filter-stats {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.rule-type-filter-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.rule-type-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.rule-type-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Override for active state on rule type buttons - keep outlined */
.rule-type-buttons .btn-outline.active {
  border-color: var(--accent-color);
  color: var(--accent-color);
  font-weight: 600;
  background: rgba(102, 126, 234, 0.05);
}

.search-and-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.search-box {
  flex: 1;
  display:flex;
  gap: 1rem;
  max-width: 400px;
}

:deep(select),
:deep(input) {
  border: 1px solid var(--border-color);
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 1rem 0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 0 1rem;
}

.field-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.scope-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.global-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.badge-icon {
  font-size: 1rem;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  white-space: nowrap;
}

.action-column {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon-only {
  color: var(--text-secondary);
}

.btn-icon-only:hover {
  color: var(--text-primary);
}

.btn-save {
  color: var(--accent-color);
}

.btn-undo:hover {
  color: rgb(245, 158, 11); /* amber-500 */
}

.btn-delete:hover {
  color: #ef4444; /* red-500 */
}

.btn-delete .delete-text {
  display: none;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

/* Row transition styles */
.rule-row-enter-active,
.rule-row-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.rule-row-enter-from,
.rule-row-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.rule-row-leave-active {
  position: absolute;
  width: 100%; /* Ensure leaving item doesn't collapse */
}

.glossary-tbody {
  position: relative; /* Needed for absolute positioning of leaving items */
}
table.glossary-table {
  width: 100%;
}
table.glossary-table thead {
  display: none;
}
tr.rule-item {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  margin: 0.5rem;
  gap: 0.5rem;
}

tr.rule-item td {
  flex: 1;
  min-width: 0;
}

tr.rule-item td:first-child {
  flex: 2;
}

tr.rule-item td:last-child {
  flex: 0 0 auto;
}

/* Unsaved changes indicator */
.rule-item.is-unsaved {
  background: rgba(251, 191, 36, 0.08);
  border-left: 3px solid rgb(251, 191, 36);
}

/* Error state indicator */
.rule-item.has-errors {
  background: rgba(239, 68, 68, 0.08);
  border-left: 3px solid rgb(239, 68, 68);
}

/* New row animation */
.rule-item.is-new,
.global-rule-item.is-new {
  animation: highlightFade 1.5s ease-out;
}

@keyframes highlightFade {
  0% {
    background: rgba(251, 191, 36, 0.3);
  }
  50% {
    background: rgba(251, 191, 36, 0.15);
  }
  100% {
    background: transparent;
  }
}

.rule-item.is-new {
  border-color: rgb(251, 191, 36);
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.15);
}

/* Error message styling */
.error-message {
  color: rgb(239, 68, 68);
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Error state for inputs */
.has-error input,
.has-error select,
.has-error .form-select {
  border-color: rgb(239, 68, 68) !important;
  background: rgba(239, 68, 68, 0.05);
}

.has-error input:focus,
.has-error select:focus,
.has-error .form-select:focus {
  border-color: rgb(239, 68, 68) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

/* Disabled state for inputs and buttons */
input:disabled,
select:disabled,
.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.05);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

@media(max-width:600px) {
  .search-and-stats {
    flex-direction: column;
  }

  .glossary-table thead {
    display: none;
  }

  .glossary-table, .glossary-table tbody, .glossary-table tr, .glossary-table td {
    display: block;
    width: 100%;
    border:none;
  }

  .glossary-table tr {
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
  }

  .glossary-table td {
    text-align: left;
    position: relative;
    border-bottom: 1px solid #e0e0e0;
    padding: 12px 15px;
  }

  .glossary-table tr td:last-child {
    border-bottom: 0;
  }

  .glossary-table td::before {
    content: attr(data-label);
    width: calc(50% - 30px);
    text-align: left;
    font-weight: 600;
    color: var(--text-primary);
  }

  .glossary-table td.is-not-replacement {
    visibility: hidden;
  }

  .glossary-table .btn-delete {
    background-color: #ef4444; /* red-500 */
    color: white;
    border-color: #ef4444;
    width: 100%;
  }

  .glossary-table .btn-delete .delete-icon {
    display: none;
  }

  .glossary-table .btn-delete .delete-text {
    display: inline;
  }
}
</style>
