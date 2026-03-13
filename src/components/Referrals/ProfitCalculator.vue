<template>
  <div class="calculator-container">
    <div class="wl-calculator">
      <h3 class="section-subtitle">{{ $t('Multilingual Revenue Calculator') }}</h3>
      <p class="section-description">
        {{ $t('This is a simple calculator to help you estimate your monthly revenue from your agency.') }}
      </p>

      <label><strong>{{ $t('Select Plan:') }}</strong></label>
      <select v-model="selectedPlan" class="input-field">
        <option value="12">{{ $t('Standard') }} – $12/{{ $t('mo') }}</option>
        <option value="29">{{ $t('Growth') }} – $29/{{ $t('mo') }}</option>
        <option value="59">{{ $t('Pro') }} – $59/{{ $t('mo') }}</option>
      </select>

      <label><strong>{{ $t("Setup Fee You'll Charge:") }}</strong></label>
      <input type="number" v-model.number="setupFee" class="input-field" />

      <label><strong>{{ $t("Monthly Service Fee You'll Charge:") }}</strong></label>
      <input type="number" v-model.number="clientFee" class="input-field" />

      <div class="addons-container">
        <strong>{{ $t('Add-On Services:') }}</strong>
        <label v-for="(addon, index) in addOns" :key="index">
          <input type="checkbox" v-model="addon.checked" />
          {{ $t(addon.label) }}
        </label>
      </div>

      <button @click="showResults = true" class="btn btn-primary calc-button">
        {{ $t('Calculate Revenue') }}
      </button>
    </div>

    <div>
      <div v-if="showResults" class="results-card">
        <h3 class="results-title">{{ $t('Revenue Summary') }}</h3>
        <p><strong>{{ $t('Client Setup Fee:') }}</strong> ${{ clientSetupFee }}</p>
        <p><strong>{{ $t('Total Monthly Fee:') }}</strong> ${{ totalClientMonthlyFee }}</p>
        <p><strong>{{ $t('Your Web Linguist Cost:') }}</strong> ${{ yourMonthlyCost }}</p>
        <p class="profit-highlight">
          <strong>{{ $t('Estimated Monthly Profit:') }}</strong> ${{ monthlyProfit }}
        </p>
        <p class="profit-highlight annual">
          <strong>{{ $t('Estimated Annual Profit:') }}</strong> ${{ annualProfit }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"

const selectedPlan = ref("12")
const setupFee = ref(299)
const clientFee = ref(199)
const showResults = ref(false)

const addOns = ref([
  {
    label: "Glossary Setup ($99 one-time)",
    price: 99,
    type: "one-time",
    checked: false,
  },
  {
    label: "Monthly QA Sync ($49/mo)",
    price: 49,
    type: "monthly",
    checked: false,
  },
  {
    label: "Localized SEO Audit ($150 one-time)",
    price: 150,
    type: "one-time",
    checked: false,
  },
  {
    label: "Monthly Analytics Report ($89/mo)",
    price: 89,
    type: "monthly",
    checked: false,
  },
])

const oneTimeAddOnsTotal = computed(() =>
  addOns.value
    .filter((a) => a.checked && a.type === "one-time")
    .reduce((sum, a) => sum + a.price, 0)
)

const monthlyAddOnsTotal = computed(() =>
  addOns.value
    .filter((a) => a.checked && a.type === "monthly")
    .reduce((sum, a) => sum + a.price, 0)
)

const clientSetupFee = computed(() => setupFee.value + oneTimeAddOnsTotal.value)
const totalClientMonthlyFee = computed(
  () => clientFee.value + monthlyAddOnsTotal.value
)
const yourMonthlyCost = computed(() => parseFloat(selectedPlan.value))
const monthlyProfit = computed(
  () => totalClientMonthlyFee.value - yourMonthlyCost.value
)
const annualProfit = computed(() => monthlyProfit.value * 12)
</script>

<style scoped>
.calculator-container {
  padding: 1rem 2rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  text-align: left;
  background: #fff;
}

.section-subtitle {
  margin-top: 0;
  margin-bottom:1rem;
}
.section-description {
  color: var(--text-secondary);
}

.wl-calculator {
  font-family: sans-serif;
  max-width: 700px;
}

.title {
  color: var(--highlight-color);
  margin-bottom: 1rem;
  text-align: left;
}

label {
  display: inline-block;
  text-align: left;
  width: 100%;
}

.input-field {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.addons-container {
  margin-bottom: 1rem;
  width: max-content;
  text-align: left;
}

.addons-container label {
  display: block;
}

.calc-button {
  background: var(--highlight-color);
  width: 100%;
}

.results-card {
  margin-top: 2rem;
  padding: 2rem;
  text-align: left;
}

.results-title {
  color: var(--highlight-color);
  margin-top: 0;
}

.profit-highlight {
  font-weight: bold;
  font-size: 1.1rem;
  color: #2d3748; /* A darker text for emphasis */
}

.profit-highlight.annual {
  margin-top: 1rem;
  font-size: 1.25rem;
  color: var(--highlight-color);
  background-color: #f0e6ff;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

@media (max-width: 1024px) {
  .calculator-container {
    flex-direction: column;
    gap: 0;
  }
  .results-card {
    margin-top: 0;
  }
}
</style>
