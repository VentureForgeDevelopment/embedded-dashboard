<template>
  <div>
    <div class="domain-select-wrapper">
      <LlInput
        v-model="domainValue"
        id="domain_input"
        name="domain_input"
        placeholder="yourwebsite.com"
        @blur="handleDomainBlur"
        :class="domainInputClass"
        @keyup.enter="selectDomain()"
      />
      <button
        v-if="showSelectBtn"
        :class="[
          'btn',
          'btn-primary',
          'set-domain-btn',
          'select-domain-btn',
          { 'btn-disabled': v$.domainValue.$invalid },
        ]"
        @click="selectDomain()"
      >
        <span v-if="!initialOnboardComplete">Continue to Language Selection</span>
        <span v-else>Save</span>
      </button>
    </div>
    <div v-if="v$.domainValue.$error" class="validation-error-message">
      {{ v$.domainValue.$errors[0]?.$message || 'Please enter a valid website address.' }}
    </div>
  </div>
</template>

<script>
import { computed } from "vue"
import useVuelidate from "@vuelidate/core"
import { required, helpers } from "@vuelidate/validators"
import LlInput from "../components/Root/Input/LlInput.vue"

// Custom validator for domain names (without protocol)
const isDomain = helpers.withMessage(
  'Please enter a valid domain (e.g., example.com)',
  (value) => {
    if (!value) return true
    // Strip protocol if present
    const withoutProtocol = value.replace(/^https?:\/\//i, '')
    // Valid domain pattern: allows subdomains, domains, and optional paths
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(\/.*)?$/.test(withoutProtocol)
  }
)

export default {
  name: "DomainSelect",
  components: {
    LlInput,
  },
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    selectedDomain: {
      type: [Boolean, String],
      required: true,
    },
    showSelectBtn: {
      type: Boolean,
      default: false,
    },
    initialOnboardComplete: {
      type: Boolean,
      required: false
    }
  },
  emits: ["update:modelValue", "update:selectedDomain"],
  setup(props, { emit }) {
    const domainValue = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    })

    const inputWrapperWidth = computed(() =>
      props.showSelectBtn ? "80%" : "100%"
    );

    const rules = computed(() => ({
      domainValue: {
        required: helpers.withMessage("website address is required", required),
        isDomain,
      },
    }))

    const v$ = useVuelidate(rules, { domainValue })

    const domainInputClass = computed(() => ({
      "is-invalid": v$.value.domainValue.$error,
    }))

    // Strip protocol from domain if present
    function stripProtocol(value) {
      if (!value) return value
      return value.replace(/^https?:\/\//i, '')
    }

    function selectDomain() {
      // Strip protocol before saving
      domainValue.value = stripProtocol(domainValue.value)

      v$.value.domainValue.$touch()
      if (!v$.value.domainValue.$invalid) {
        emit("update:selectedDomain", domainValue.value)
      }
    }

    function handleDomainBlur() {
      // Strip protocol if present (don't add it)
      domainValue.value = stripProtocol(domainValue.value)
      v$.value.domainValue.$touch()
    }

    return {
      domainValue,
      v$,
      inputWrapperWidth,
      domainInputClass,
      selectDomain,
      handleDomainBlur,
    }
  },
}
</script>

<style scoped>
.domain-select-wrapper {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
:deep(.input-wrapper) {
  width: v-bind(inputWrapperWidth);
}
.set-domain-btn {
  width: fit-content;
}
.validation-error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  text-align: left;
  margin-top: 0.25rem;
}
/* @media screen and (max-width: 769px) {
  .domain-select-wrapper {
    flex-direction: column;
  }
} */
</style>
