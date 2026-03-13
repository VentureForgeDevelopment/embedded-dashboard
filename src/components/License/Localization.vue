<template>
  <div class="localization-settings">
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

    <div class="setting-section">
      <div class="title-container">
        <div class="icon-wrapper globe-icon" v-html="globeIcon"></div>
        <h3 class="title">{{ $t('Native Country') }}</h3>
      </div>
      <p class="description">
        {{ $t('Set the primary country for your website for localization purposes.') }}
      </p>
      <div class="select-wrapper with-spinner">
        <select
          v-model="defaultCountry"
          class="language-select"
          @change="updateCountry"
          :disabled="loading.country"
          id="default_country_select"
        >
          <option
            v-for="country in countries"
            :key="country.code"
            :value="country.code"
          >
            {{ country.name }} ({{ country.code }})
          </option>
        </select>
        <div class="loading-spinner" v-if="loading.country"></div>
        <div v-if="defaultCountry" class="current-language-indicator">
          <span>{{ $t('Current:') }} <strong>{{ currentCountry.name }}</strong></span> <span v-html="currentCountry.flag" class="flag-icon"></span>
        </div>
      </div>
      <label class="toggle-label with-spinner" style="margin-top: 1rem;">
        <input
          type="checkbox"
          class="toggle-checkbox"
          :disabled="loading.phone"
          @change="updatePhoneNumberLocalization"
          v-model="phoneNumberLocalizationEnabled"
        />
        <span class="toggle-slider"></span>
        <span class="toggle-text">{{ $t('Enable Phone Number Localization') }}</span>
        <div class="loading-spinner" v-if="loading.phone"></div>
      </label>
      <div v-if="phoneNumberLocalizationEnabled" class="info-box">
        <p><strong>{{ $t('Phone Code:') }}</strong> {{ currentCountry.phone_code || $t('N/A') }}</p>
        <p class="help-text">
          {{ $t('When enabled, phone numbers on your site will be automatically prepended with') }} <strong>{{ currentCountry.phone_code || '...' }}</strong> {{ $t('based on your native country selection.') }}
        </p>
      </div>
    </div>
    <div class="setting-section">
      <div class="title-container">
        <div class="icon-wrapper">
          <CurrencyUsd />
        </div>
        <h3 class="title">{{ $t('Currency Localization') }}</h3>
      </div>
      <p class="description">
        {{ $t("Enable to visually convert prices into the visitor's local currency based on approximate exchange rates.") }}
      </p>
      <label class="toggle-label with-spinner">
        <input
          type="checkbox"
          class="toggle-checkbox"
          :disabled="loading.currency"
          @change="updateCurrencyLocalization"
          v-model="currencyLocalizationEnabled"
        />
        <span class="toggle-slider"></span>
        <span class="toggle-text">{{ $t('Enable Currency Localization') }}</span>
        <div class="loading-spinner" v-if="loading.currency"></div>
      </label>

      <div v-if="currencyLocalizationEnabled" class="info-box">
        <p><strong>{{ $t('Base Currency:') }}</strong> {{ currentCountryCurrency }}</p>
        <p class="help-text">
          {{ $t('Prices displayed in') }} <strong>{{ currentCountryCurrency }}</strong> {{ $t('will show approximate conversions in each visitor\'s local currency. Exchange rates are updated daily from the European Central Bank. This is a visual annotation only — original prices are never modified.') }}
        </p>
      </div>
    </div>
    <div class="setting-section">
      <div class="title-container">
        <div class="icon-wrapper" v-html="translateIcon"></div>
        <h3 class="title">{{ $t('Default Language') }}</h3>
      </div>
      <p class="description">
        {{ $t('Set the primary language for your website. This is the language your content is originally written in.') }}
      </p>
      <div class="select-wrapper with-spinner">
        <select
          v-model="defaultLanguage"
          class="language-select"
          @change="updateDefaultLanguage"
          :disabled="loading.language"
          id="default_language_select"
        >
          <option
            v-for="language in supportedBaseLanguages"
            :key="language.code"
            :value="language.code"
          >
            {{ language.name }} ({{ language.code }})
          </option>
        </select>
        <div class="loading-spinner" v-if="loading.language"></div>
        <div v-if="currentLanguage" class="current-language-indicator">
          <span>{{ $t('Current:') }} <strong>{{ currentLanguage.name }}</strong></span> <span v-html="currentLanguage.flag" class="flag-icon"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useLanguageStore } from "../../stores/language";
import { useLicenseStore } from "../../stores/license";
import SlideInNotification from "../SlideInNotification.vue";
import CurrencyUsd from "vue-material-design-icons/CurrencyUsd.vue";

export default {
  name: "Localization",
  components: {
    CurrencyUsd,
    SlideInNotification,
  },
  props: {
    license: {
      type: Object,
      required: true,
    },
  },
  emits: ["update-setting", "setting-saved"],
  setup(props, { emit }) {
    const languageStore = useLanguageStore();
    const licenseStore = useLicenseStore();

    const languages = computed(() => languageStore.allLanguages);
    const supportedBaseLanguages = computed(() => {
      const baseFamilies = ['en', 'fr', 'es', 'it', 'pt', 'ro']
      return languageStore.allLanguages.filter(l =>
        baseFamilies.includes(l.code.toLowerCase().split('-')[0])
      )
    });
    const countries = computed(() => languageStore.allCountries);
    const defaultLanguage = ref("en-US");
    const currencyLocalizationEnabled = ref(false);
    const defaultCountry = ref("US");
    const phoneNumberLocalizationEnabled = ref(false);
    const loading = ref({
      country: false,
      phone: false,
      currency: false,
      language: false,
    });
    const showSuccessNotification = ref(false);
    const successMessage = ref("");
    const showFailNotification = ref(false);
    const failMessage = ref("");

    const translateIcon = computed(() => {
      const defaultIcons = licenseStore.state.icons.find(
        (icon) => icon.id === "default"
      );
      const translateVariant = defaultIcons?.variants.find(
        (variant) => variant.name === "translate"
      );
      return translateVariant ? translateVariant.data : "";
    });

    const globeIcon = computed(() => {
      const defaultIcons = licenseStore.state.icons.find(
        (icon) => icon.id === "default"
      );
      const globeVariant = defaultIcons?.variants.find(
        (variant) => variant.name === "globe"
      );
      return globeVariant ? globeVariant.data : "";
    });

    const currentLanguage = computed(() => {
      const lang = languageStore.getLanguageByCode(defaultLanguage.value);
      return lang ? lang : defaultLanguage.value;
    });

    const currentCountry = computed(() => {
      return languageStore.allCountries.find(c => c.code === defaultCountry.value) || {};
    });

    const currentCountryCurrency = computed(() => {
      return currentCountry.value?.currency_code || 'USD';
    });

    watch(
      () => props.license,
      (newLicense) => {
        if (newLicense?.settings?.localization?.default_language) {
          defaultLanguage.value = newLicense.settings.localization.default_language;
        }
        if (newLicense?.settings?.localization?.country) {
          defaultCountry.value = newLicense.settings.localization.country;
        }
        if (newLicense?.settings?.localization) {
          currencyLocalizationEnabled.value = !!newLicense.settings.localization.localize_currency;
          phoneNumberLocalizationEnabled.value = !!newLicense.settings.localization.localize_phone_numbers;
        } else {
          defaultLanguage.value = "en-US"; // Fallback to English
        }
      },
      { immediate: true, deep: true }
    );

    function updateCountry() {
      if (!props.license?.id) return;
      loading.value.country = true;
      licenseStore.updateSingleLicenseSetting({
        license_id: props.license.id,
        setting_key: 'localization.country',
        setting_value: defaultCountry.value
      }).then((res) => {
        if (res.data?.data) emit('setting-saved', res.data.data);
        successMessage.value = "Native country updated successfully.";
        showSuccessNotification.value = true;
        setTimeout(() => showSuccessNotification.value = false, 3000);
      }).catch((error) => {
        failMessage.value = `Failed to update country: ${error.message || 'Unknown error'}`;
        showFailNotification.value = true;
        setTimeout(() => showFailNotification.value = false, 3000);
      })
      .finally(() => {
        loading.value.country = false;
      });
    }

    function updateCurrencyLocalization() {
      if (!props.license?.id) return;
      loading.value.currency = true;
      licenseStore.updateSingleLicenseSetting({
        license_id: props.license.id,
        setting_key: 'localization.localize_currency',
        setting_value: currencyLocalizationEnabled.value
      }).then((res) => {
        if (res.data?.data) emit('setting-saved', res.data.data);
        successMessage.value = "Currency localization setting updated successfully.";
        showSuccessNotification.value = true;
        setTimeout(() => showSuccessNotification.value = false, 3000);
      }).catch((error) => {
        failMessage.value = `Failed to update currency localization: ${error.message || 'Unknown error'}`;
        showFailNotification.value = true;
        setTimeout(() => showFailNotification.value = false, 3000);
      })
      .finally(() => {
        loading.value.currency = false;
      });
    }

    function updatePhoneNumberLocalization() {
      if (!props.license?.id) return;
      loading.value.phone = true;
      licenseStore.updateSingleLicenseSetting({
        license_id: props.license.id,
        setting_key: 'localization.localize_phone_numbers',
        setting_value: phoneNumberLocalizationEnabled.value
      }).then((res) => {
        if (res.data?.data) emit('setting-saved', res.data.data);
        successMessage.value = "Phone number localization setting updated successfully.";
        showSuccessNotification.value = true;
        setTimeout(() => showSuccessNotification.value = false, 3000);
      }).catch((error) => {
        failMessage.value = `Failed to update phone number localization: ${error.message || 'Unknown error'}`;
        showFailNotification.value = true;
        setTimeout(() => showFailNotification.value = false, 3000);
      })
      .finally(() => {
        loading.value.phone = false;
      });
    }

    function updateDefaultLanguage() {
      if (!props.license?.id) return;
      loading.value.language = true;
      licenseStore.updateSingleLicenseSetting({
        license_id: props.license.id,
        setting_key: 'localization.default_language',
        setting_value: defaultLanguage.value
      }).then((res) => {
        if (res.data?.data) emit('setting-saved', res.data.data);
        successMessage.value = "Default language updated successfully.";
        showSuccessNotification.value = true;
        setTimeout(() => showSuccessNotification.value = false, 3000);
      }).catch((error) => {
        failMessage.value = `Failed to update default language: ${error.message || 'Unknown error'}`;
        showFailNotification.value = true;
        setTimeout(() => showFailNotification.value = false, 3000);
      }).finally(() => {
        loading.value.language = false;
      });
    }

    onMounted(() => {
      languageStore.fetchSupportedLanguages();

      // Force refresh if cached countries are missing currency_code field
      const needsRefresh = languageStore.allCountries.length > 0 &&
        !languageStore.allCountries[0]?.currency_code;
      languageStore.fetchSupportedCountries(needsRefresh);
    });

    return {
      // Notifications
      showSuccessNotification,
      successMessage,
      showFailNotification,
      failMessage,

      // Data
      languages,
      supportedBaseLanguages,
      countries,
      defaultLanguage,
      defaultCountry,
      translateIcon,
      globeIcon,
      loading,
      currentLanguage,
      currentCountry,
      currentCountryCurrency,
      currencyLocalizationEnabled,
      phoneNumberLocalizationEnabled,

      // Methods
      updateCountry,
      updateCurrencyLocalization,
      updatePhoneNumberLocalization,
      updateDefaultLanguage,
      };
  },
};
</script>

<style scoped>
.localization-settings {
  position: relative;
  padding: 1rem;
}
.setting-section {
  margin-bottom: 1rem;
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}
.title-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-primary);
}
.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-wrapper :deep(svg) {
  width: 24px;
  height: 24px;
  fill: var(--text-primary);
}
.globe-icon :deep(svg){ 
  fill:none!important;
}
.title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}
.description {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: left;
}
.select-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.with-spinner {
  display: flex;
  align-items: center;
}
.language-select {
  flex-grow: 1;
  max-width: 400px;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
}
.current-language-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}
.current-language-indicator strong {
  color: var(--text-primary);
  font-weight: 600;
}
.flag-icon{
  display: flex;
  align-items: center;
  justify-content: center;
  width:30px;
  height: auto;
  margin-left: 5px;
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

.info-box {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--bg-primary);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.loading-spinner {
  margin:0;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--success-green); /* Use a theme color if available */
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media screen and (max-width: 550px) {
  .select-wrapper{
    flex-direction: column;
  }
}
</style>
