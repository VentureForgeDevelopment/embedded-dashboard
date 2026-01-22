import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { config } from "../config/environment"
import api from "../utils/api"
import { useAuthStore } from "./auth"

const speechBubbleIconUrl = new URL(
  "../assets/images/bubble_icon.png",
  import.meta.url
).href

export const useLicenseStore = defineStore("license", () => {
  // State
  const state = ref({
    licenses: null,
    active_license: null,
    license_rules: [],
    icons: [
      {
        id: "default",
        type: "svg",
        name: "Default",
        variants: [
          {
            name: "globe",
            displayName: "Globe",
            data: '<svg xmlns="http://www.w3.org/2000/svg" class="icon globe-icon" width="24" height="24" viewBox="0 0 420 420" stroke="black" fill="none"><path stroke-width="26" d="M209,15a195,195 0 1,0 2,0z"/><path stroke-width="26" d="m210,15v390m195-195H15M59,90a260,260 0 0,0 302,0 m0,240 a260,260 0 0,0-302,0M195,20a250,250 0 0,0 0,382 m30,0 a250,250 0 0,0 0-382"/></svg>',
          },
          {
            name: "translate",
            displayName: "Translate",
            data: '<svg xmlns="http://www.w3.org/2000/svg" class="icon translate-icon" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m476-80 182-480h84L924-80h-84l-43-122H603L560-80h-84ZM160-200l-56-56 202-202q-35-35-63.5-80T190-640h84q20 39 40 68t48 58q33-33 68.5-92.5T484-720H40v-80h280v-80h80v80h280v80H564q-21 72-63 148t-83 116l96 98-30 82-122-125-202 201Zm468-72h144l-72-204-72 204Z"/></svg>',
          },
          {
            name: "text_to_speech",
            displayName: "Text to Speech",
            data: '<svg xmlns="http://www.w3.org/2000/svg" class="icon text-to-speech-icon" height="30px" viewBox="0 -960 960 960" width="30px" fill="black"><path d="M160-80q-33 0-56.5-23.5T80-160v-640q0-33 23.5-56.5T160-880h326l-80 80H160v640h440v-80h80v80q0 33-23.5 56.5T600-80H160Zm80-160v-80h280v80H240Zm0-120v-80h200v80H240Zm360 0L440-520H320v-200h120l160-160v520Zm80-122v-276q36 21 58 57t22 81q0 45-22 81t-58 57Zm0 172v-84q70-25 115-86.5T840-620q0-78-45-139.5T680-846v-84q104 27 172 112.5T920-620q0 112-68 197.5T680-310Z"/></svg>',
          },
          {
            name: "ear_sound",
            displayName: "Ear Sound",
            data: '<svg fill=#e3e3e3 height=24px viewBox="0 -960 960 960"width=24px xmlns=http://www.w3.org/2000/svg class="icon ear-sound-icon"><path d="M240-80q62 0 101.5-31t60.5-91q17-50 32.5-70t71.5-64q62-50 98-113t36-151q0-119-80.5-199.5T360-880q-119 0-199.5 80.5T80-600h80q0-85 57.5-142.5T360-800q85 0 142.5 57.5T560-600q0 68-27 116t-77 86q-52 38-81 74t-43 78q-14 44-33.5 65T240-160q-33 0-56.5-23.5T160-240H80q0 66 47 113t113 47Zm120-420q42 0 71-29.5t29-70.5q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 41 29 70.5t71 29.5Zm380 121-59-59q19-37 29-77.5t10-84.5q0-44-10-84t-29-77l59-59q29 49 44.5 104.5T800-600q0 61-15.5 116.5T740-379Zm117 116-59-58q39-60 60.5-130T880-598q0-78-22-148.5T797-877l60-60q49 72 76 157.5T960-600q0 94-27 179.5T857-263Z"/></svg>',
          },
        ],
      },
      {
        id: "speech_bubble",
        name: "Speech Bubble Light",
        type: "image",
        data: speechBubbleIconUrl,
      },
      // {
      //   id: "speech_bubble_dark",
      //   name: "Speech Bubble Dark",
      //   type: "image",
      //   data: "/images/bubble_icon_dark.png",
      // },
      {
        id: "no_icon",
        name: "Hide",
        type: "none",
        data: "",
      },
    ],
    loading: {
      licenses: false,
      license_rules: false,
      dns: false,
    },
    dnsCheckData: {},
    isDetectingOrigin: false,
    detectedOriginIp: null,
    originDetectionError: null,
    isCheckingHealth: false,
    originHealth: null,
    originHealthError: null,
    verificationStatus: "unverified", // unverified, verifying, verified, failed
  })

  //Computed
  const appApiUrl = computed(() => config.appApiUrl)
  const billingApiUrl = computed(() => config.billingApiUrl)
  const authStore = useAuthStore()

  //Mutations
  function setLoading(type, value) {
    state.value.loading[type] = value
  }

  function setLicenses(licenses) {
    state.value.licenses = licenses
  }

  function setLicenseRules(rules) {
    state.value.license_rules = rules
  }

  //actions
  function saveLicenseToWordPress(payload) {
    return new Promise((resolve, reject) => {
      if (!window.WebLinguistDashboard?.isEmbedded) {
        return reject(new Error("Not in embedded WordPress mode."))
      }

      const { ajaxUrl, saveLicenseKeyNonce } = window.WebLinguistDashboard
      const { license_id, license_key, subscription_id } = payload

      const formData = new FormData()
      formData.append("action", "wld_save_license_key")
      formData.append("nonce", saveLicenseKeyNonce)
      formData.append("license_id", license_id)
      formData.append("license_key", license_key)
      formData.append("subscription_id", subscription_id || "")

      // Using fetch directly as `api` util is for the main app API.
      fetch(ajaxUrl, {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok")
          }
          return response.json()
        })
        .then((data) => {
          if (data.success) {
            console.log(
              "Successfully saved license to WordPress.",
              data.data.message
            )
            resolve(data)
          } else {
            throw new Error(
              data.data.message || "Failed to save license to WordPress."
            )
          }
        })
        .catch((error) => {
          console.error("Error saving license to WordPress:", error)
          reject(error)
        })
    })
  }

  function getLicenses() {
    return new Promise((resolve, reject) => {
      setLoading("licenses", true)
      api
        .get(`${appApiUrl.value}licenses`, {
          headers: {
            "X-Account-ID": authStore.currentAccountId.toString(),
          },
        })
        .then((res) => {
          let licensesToSet = res.data.data || []

          // If embedded in WordPress, apply smart filtering to find the correct license
          if (window.WebLinguistDashboard?.isEmbedded) {
            const allLicenses = res.data.data || []
            const wpLicenseId = window.WebLinguistDashboard.licenseId
            const currentHostname = window.location.hostname
            let activeLicense = null

            if (wpLicenseId) {
              // A license ID is saved in WordPress. First, try to find it.
              activeLicense = allLicenses.find(
                (license) => license.id == wpLicenseId
              )

              if (activeLicense) {
                console.log("Found active license by saved ID:", wpLicenseId)

                saveLicenseToWordPress({
                  license_id: activeLicense.id,
                  license_key: activeLicense.license_key,
                  subscription_id: activeLicense.subscription_id,
                }).catch((err) => {
                  console.error(
                    "Failed to auto-save/update license in WordPress:",
                    err
                  )
                })

              } else {
                // The saved wpLicenseId is stale or invalid for this user.
                console.warn(
                  `Stale license ID ${wpLicenseId} found. Falling back to domain match.`
                )
              }
            }

            // If no license was found by ID (or if the ID was stale), try to match by domain.
            if (!activeLicense) {
              const licenseByDomain = allLicenses.find(
                (license) => license.domain_name === currentHostname
              )

              if (licenseByDomain) {
                console.log(
                  `Found matching license for ${currentHostname}. Updating WordPress.`
                )
                // This will save the license for a fresh setup or update a stale one.
                saveLicenseToWordPress({
                  license_id: licenseByDomain.id,
                  license_key: licenseByDomain.license_key,
                  subscription_id: licenseByDomain.subscription_id,
                }).catch((err) => {
                  console.error(
                    "Failed to auto-save/update license in WordPress:",
                    err
                  )
                })
                activeLicense = licenseByDomain
              }
            }

            // Determine what to display
            if (activeLicense) {
              // If we found a single active license (either by ID or domain), show only that one.
              licensesToSet = [activeLicense]
            } else {
              // If no specific license could be identified, show all available licenses.
              licensesToSet = allLicenses
            }
            state.value.active_license = activeLicense
          } else {
            state.value.active_license = null
          }
          setLicenses(licensesToSet)
          setLoading("licenses", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("licenses", false)
          reject(err)
        })
    })
  }

  function getLicenseRules(payload) {
    return new Promise((resolve, reject) => {
      setLoading("license_rules", true)

      api
        .get(`${appApiUrl.value}license/${payload.license_id}/rules`, {
          headers: {
            "X-Account-ID": authStore.currentAccountId.toString(),
          },
        })
        .then((res) => {
          // Transform camelCase API response to snake_case for frontend
          const transformedRules = res.data.rules.map((rule) => ({
            id: rule.id,
            type: rule.type,
            source_phrase: rule.sourcePhrase,
            target_phrase: rule.targetPhrase,
            source_language: rule.sourceLanguage,
            target_language: rule.targetLanguage,
            global_rule: rule.globalRule,
            scope: rule.scope,
            is_active: rule.isActive,
            created_at: rule.createdAt,
            updated_at: rule.updatedAt,
          }))
          setLicenseRules(transformedRules)
          setLoading("license_rules", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("license_rules", false)
          reject(err)
        })
    })
  }

  function addLicenseRule(payload) {
    return new Promise((resolve, reject) => {
      // You might want a more specific loading state later
      setLoading("license_rules", true)

      api
        .post(
          `${appApiUrl.value}license/${payload.license_id}/rules`,
          {
            source_phrase: payload.source_phrase,
            target_phrase: payload.target_phrase,
            target_language: payload.target_language,
            type: payload.type,
            global_rule: payload.global_rule,
            scope: payload.scope || "license",
            is_active: payload.is_active,
          },
          {
            headers: {
              "X-Account-ID": authStore.currentAccountId.toString(),
            },
          }
        )
        .then((res) => {
          // Transform and add the new rule returned from the API to the start of the list
          const rule = res.data.data
          const transformedRule = {
            id: rule.id,
            type: rule.type,
            source_phrase: rule.sourcePhrase,
            target_phrase: rule.targetPhrase,
            source_language: rule.sourceLanguage,
            target_language: rule.targetLanguage,
            global_rule: rule.globalRule,
            scope: rule.scope,
            is_active: rule.isActive,
            created_at: rule.createdAt,
            updated_at: rule.updatedAt,
          }
          state.value.license_rules.unshift(transformedRule)
          setLoading("license_rules", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("license_rules", false)
          reject(err)
        })
    })
  }

  function updateLicenseRule(payload) {
    return new Promise((resolve, reject) => {
      setLoading("license_rules", true)

      api
        .put(
          `${appApiUrl.value}license/${payload.license_id}/rules/${payload.rule_id}`,
          {
            source_phrase: payload.source_phrase,
            target_phrase: payload.target_phrase,
            target_language: payload.target_language,
            type: payload.type,
            global_rule: payload.global_rule,
            scope: payload.scope || "license",
            is_active: payload.is_active,
          },
          {
            headers: {
              "X-Account-ID": authStore.currentAccountId.toString(),
            },
          }
        )
        .then((res) => {
          // Transform camelCase API response to snake_case for frontend
          const transformedRules = res.data.rules.map((rule) => ({
            id: rule.id,
            type: rule.type,
            source_phrase: rule.sourcePhrase,
            target_phrase: rule.targetPhrase,
            source_language: rule.sourceLanguage,
            target_language: rule.targetLanguage,
            global_rule: rule.globalRule,
            scope: rule.scope,
            is_active: rule.isActive,
            created_at: rule.createdAt,
            updated_at: rule.updatedAt,
          }))
          setLicenseRules(transformedRules)
          setLoading("license_rules", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("license_rules", false)
          reject(err)
        })
    })
  }

  function deleteLicenseRule(payload) {
    return new Promise((resolve, reject) => {
      setLoading("license_rules", true)

      api
        .delete(
          `${appApiUrl.value}license/${payload.license_id}/rules/${payload.rule_id}`,
          {
            headers: {
              "X-Account-ID": authStore.currentAccountId.toString(),
            },
          }
        )
        .then((res) => {
          // Transform camelCase API response to snake_case for frontend
          const transformedRules = res.data.rules.map((rule) => ({
            id: rule.id,
            type: rule.type,
            source_phrase: rule.sourcePhrase,
            target_phrase: rule.targetPhrase,
            source_language: rule.sourceLanguage,
            target_language: rule.targetLanguage,
            global_rule: rule.globalRule,
            scope: rule.scope,
            is_active: rule.isActive,
            created_at: rule.createdAt,
            updated_at: rule.updatedAt,
          }))
          setLicenseRules(transformedRules)
          setLoading("license_rules", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("license_rules", false)
          reject(err)
        })
    })
  }

  function updateLicenseSettings(payload) {
    return new Promise((resolve, reject) => {
      setLoading("licenses", true)

      const requestBody = {
        settings: payload.settings,
      }

      // Conditionally add other properties to the request body
      if (payload.domain_name !== undefined) {
        requestBody.domain_name = payload.domain_name
      }
      if (payload.tts_enabled !== undefined) {
        requestBody.tts_enabled = payload.tts_enabled
      }
      if (payload.tts_highlighting !== undefined) {
        requestBody.tts_highlighting = payload.tts_highlighting
      }
      if (payload.poly_enabled !== undefined) {
        requestBody.poly_enabled = payload.poly_enabled
      }

      api
        .put(`${appApiUrl.value}licenses/${payload.license_id}`, requestBody, {
          headers: {
            "X-Account-ID": authStore.currentAccountId.toString(),
          },
        })
        .then((res) => {
          setLoading("licenses", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("licenses", false)
          reject(err)
        })
    })
  }

  function updateSingleLicenseSetting(payload) {
    return new Promise((resolve, reject) => {
      setLoading("licenses", true) // Use a general loading state

      api
        .post(
          `${appApiUrl.value}licenses/${payload.license_id}/update_setting`,
          {
            setting_key: payload.setting_key,
            setting_value: payload.setting_value,
          },
          {
            headers: {
              "X-Account-ID": authStore.currentAccountId.toString(),
            },
          }
        )
        .then((res) => {
          setLoading("licenses", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("licenses", false)
          reject(err)
        })
    })
  }

  function updateLicenseDomain(payload) {
    return new Promise((resolve, reject) => {
      setLoading("licenses", true)

      api
        .post(
          `${appApiUrl.value}licenses/${payload.license_id}/update_domain`,
          {
            domain_name: payload.domain_name,
          },
          {
            headers: {
              "X-Account-ID": authStore.currentAccountId.toString(),
            },
          }
        )
        .then((res) => {
          setLoading("licenses", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("licenses", false)
          reject(err)
        })
    })
  }

  async function enrichLanguages(languages) {
    if (!languages || languages.length === 0) return []

    // Asynchronously fetch flags and localized names for each language
    return await Promise.all(
      languages.map(async (lang) => {
        const langCode = lang.code
        const requests = []

        // Request flag if it doesn't exist
        if (!lang.flag) {
          requests.push(
            api
              .get(`${appApiUrl.value}languages/${langCode}/flag`)
              .catch(() => ({ data: { flag: "" } }))
          )
        } else {
          requests.push(Promise.resolve({ data: { flag: lang.flag } })) // Keep existing flag
        }

        // Always request the localized name to overwrite the English one
        requests.push(
          api
            .get(`${appApiUrl.value}languages/${langCode}/localized_name`)
            .catch(() => ({ data: { name: lang.name } }))
        )
        try {
          const [flagResponse, nameResponse] = await Promise.all(requests)
          return {
            ...lang,
            flag: flagResponse?.data?.flag || lang.flag || "",
            name: nameResponse?.data?.name || lang.name,
          }
        } catch (error) {
          console.error(`Failed to fetch details for ${langCode}:`, error)
          return { ...lang, flag: lang.flag || "", name: lang.name } // Fallback on error
        }
      })
    )
  }

  /**
   * Generate installation script for a license
   * Returns the appropriate script based on environment (dev vs production)
   *
   * @param {Object} license - License object with settings, licenseKey, name, etc.
   * @returns {string} Installation script
   */
  async function generateInstallationScript(license) {
    if (!license) return ""

    const isDev =
      config.environment === "local" || config.environment === "development"

    if (isDev) {
      // Dev environment: Local loader with inline settings
      const settings = license.settings || {}
      const languages = settings.languages || []
      const position = settings.position || {}
      const icon = settings.icon || {}
      const colors = settings.colors || {}
      const localization = settings.localization || {}
      const display = settings.display || {}

      const enrichedLanguages = await enrichLanguages(languages)

      const dnsCheckData = license.dns_check || {}
      const dnsInstallationEnabled =
        dnsCheckData.status === "not_started_configuring" ? false : true

      return `// Gracefully uninstall existing toolbar and load local version
(function() {
    console.log('🔧 Web Linguist Dev Script: Uninstalling existing toolbar...');

    // Step 1: Restore original content if toolbar has hash mappings
    const hashToElement = window.__webLinguistHashToElement;
    if (hashToElement && hashToElement.size > 0) {
        console.log('  🔄 Restoring original content from', hashToElement.size, 'elements');
        let restored = 0;

        hashToElement.forEach((elementData) => {
            if (!elementData.originalContent) return;

            try {
                const originalContent = elementData.originalContent;

                if (elementData.textNode) {
                    // Restore text node
                    const currentText = elementData.textNode.nodeValue || '';
                    const leadingSpace = currentText.match(/^\\s*/)[0];
                    const trailingSpace = currentText.match(/\\s*$/)[0];
                    elementData.textNode.nodeValue = leadingSpace + originalContent + trailingSpace;
                    restored++;
                } else if (elementData.element) {
                    const element = elementData.element;

                    if (element.tagName === 'INPUT') {
                        if (element.type === 'submit' || element.type === 'button') {
                            element.value = originalContent;
                        } else {
                            element.placeholder = originalContent;
                        }
                        restored++;
                    } else if (element.tagName === 'TEXTAREA') {
                        element.value = originalContent;
                        restored++;
                    } else if (element.tagName === 'META' || element.tagName === 'LINK') {
                        const attrToRestore = elementData.attribute || 'content';
                        element.setAttribute(attrToRestore, originalContent);
                        restored++;
                    } else if (elementData.type === 'attribute' && elementData.attribute) {
                        element.setAttribute(elementData.attribute, originalContent);
                        restored++;
                    } else {
                        element.textContent = originalContent;
                        restored++;
                    }
                }
            } catch (error) {
                console.warn('  ⚠️ Failed to restore element:', error);
            }
        });

        console.log(\`  ✅ Restored \${restored} elements to original content\`);
    } else {
        console.log('  ℹ️ No existing translations to restore');
    }

    // Step 2: Clean up data attributes (but don't remove elements)
    const elementsWithWeblingId = document.querySelectorAll('[data-webling-id]');
    if (elementsWithWeblingId.length > 0) {
        console.log(\`  🧹 Removing data-webling-id from \${elementsWithWeblingId.length} elements\`);
        elementsWithWeblingId.forEach(el => {
            el.removeAttribute('data-webling-id');
        });
    }

    // Step 3: Remove toolbar UI elements only
    const toolbarSelectors = [
        '#web-linguist-toolbar',
        '.language-toolbar'
    ];

    let removed = 0;
    toolbarSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            console.log('  ✓ Removed toolbar UI:', el.tagName, el.id || el.className);
            el.remove();
            removed++;
        });
    });

    // Step 4: Remove toolbar scripts
    const scriptSelectors = [
        'script[src*="weblinguist-toolbar.js"]',
        'script[src*="language-toolbar.js"]',
        'script[src*="/toolbar/"]'
    ];

    scriptSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(script => {
            console.log('  ✓ Removed script:', script.src);
            script.remove();
            removed++;
        });
    });

    // Step 5: Remove toolbar styles
    const styleElement = document.getElementById('web-linguist-toolbar-styles');
    if (styleElement) {
        styleElement.remove();
        console.log('  ✓ Removed toolbar styles');
    }

    console.log(\`  🗑️ Removed \${removed} toolbar elements\`);

    // Step 6: Clear global objects
    delete window.weblingSettings;
    delete window.weblingToolbar;
    delete window.__webLinguistToolbarInstance;
    delete window.__WEBLING_INITIALIZED__;
    delete window.__webLinguistHashToElement;

    console.log('  ✅ Cleanup complete');

    // Step 7: Load local toolbar after a short delay
    setTimeout(() => {
        console.log('🚀 Loading local toolbar from localhost:8080...');

        // Configure settings for local toolbar with development API URL
        window.weblingSettings = {
            licenseKey: '${license.license_key}',
            domain: '${license.name || ""}',
            languages: ${JSON.stringify(enrichedLanguages)},
            display: {
                mode: '${display.mode || "floating"}',
                css_selector: '${display.css_selector || ""}',
                custom_css: '${JSON.stringify(display.custom_css) || ""}',
                embedded_style: '${display.embedded_style || "full"}'
            },
            position: {
                vertical: '${position.vertical || "bottom"}',
                horizontal: '${position.horizontal || "right"}',
                verticalOffset: ${position.verticalOffset || 20},
                horizontalOffset: ${position.horizontalOffset || 20}
            },
            icon: {
                id: '${icon.id || "default"}',
                name: '${icon.name || "globe"}',
                color: '${icon.color || "white"}',
                size: '${icon.size || "large"}',
                flag_icon: ${icon.flag_icon === true ? "true" : "false"},
                flag_icon_position: '${icon.flag_icon_position || "floating"}'
            },
            colors: {
                accent_color: {
                  mode: '${colors.accent_color?.mode || "linear"}',
                    color: {
                      r: ${colors.accent_color?.color?.r || 102},
                      g: ${colors.accent_color?.color?.g || 126},
                      b: ${colors.accent_color?.color?.b || 234},
                      a: ${colors.accent_color?.color?.a || 1}
                    },
                    degree: ${colors.accent_color?.degree || 135},
                    gradients: ${JSON.stringify(
                      colors.accent_color?.gradients || []
                    )},
                    css: '${
                      colors.accent_color?.css ||
                      "background-image:linear-gradient(135deg,rgba(102,126,234,1) 0%,rgba(118,75,162,1) 100%)"
                    }'
                },
                accent_text: '${colors?.accent_text || "white"}'
            },
            localization: {
              'country': '${localization.country || "US"}',
              'default_language': '${localization.default_language || "en-US"}',
              'localize_phone_numbers': ${
                localization.localize_phone_numbers || false
              },
              'localize_currency': ${localization.localize_currency || false}
            },
            dnsInstallationEnabled: ${dnsInstallationEnabled || false},
            enabled: ${settings.enabled ? "true" : "false"},
            ttsEnabled: ${settings.ttsEnabled ? "true" : "false"},
            polyEnabled: ${settings.polyEnabled ? "true" : "false"},
            ttsHighlighting: ${
              settings.ttsHighlighting !== undefined
                ? settings.ttsHighlighting
                  ? "true"
                  : "false"
                : "true"
            },
            licenseType: '${license.type || "subscription"}',
            apiUrl: '${config.appApiUrl.replace(
              /\/$/,
              ""
            )}',  // Use configured API URL
            debugMode: true  // Enable debug mode for local development
        };

        console.log('  🔗 Using API:', window.weblingSettings.apiUrl);

        // Load local toolbar
        const script = document.createElement('script');
        script.type = 'module';
        script.async = true;
        script.src = 'http://localhost:8080/language-toolbar.js';
        script.onload = () => console.log('✅ Local toolbar loaded successfully');
        script.onerror = () => console.error('❌ Failed to load local toolbar - is the dev server running on port 8080?');
        document.head.appendChild(script);
    }, 200);
})();`
    } else {
      // Production: CDN version with baked-in settings
      const cdnUrl =
        import.meta.env.VITE_TOOLBAR_CDN_URL || "https://tb-cdn.weblinguist.ai"

      return `<!-- Web Linguist Language Translator -->
        <script async type="module" src="${cdnUrl}/toolbar/${license.license_key}/weblinguist-toolbar.js"><\/script>`
    }
  }

  function startDnsConfiguration(payload) {
    setLoading("dns", true)
    return api
      .post(
        `${appApiUrl.value}licenses/${payload.license_id}/dns-check/start-configuration`,
        {},
        {
          headers: { "X-Account-ID": authStore.currentAccountId.toString() },
        }
      )
      .then((response) => {
        if (response.data?.data) {
          state.value.dnsCheckData.status = response.data?.data?.status
        }
        setLoading("dns", false)
        return response
      })
      .catch((error) => {
        setLoading("dns", false)
        throw error
      })
  }

  function stopDnsConfiguration(payload) {
    setLoading("dns", true)
    return api
      .post(
        `${appApiUrl.value}licenses/${payload.license_id}/dns-check/stop-configuration`,
        {},
        {
          headers: { "X-Account-ID": authStore.currentAccountId.toString() },
        }
      )
      .then((response) => {
        if (response.data?.data) {
          state.value.dnsCheckData.status = response.data?.data?.status
        }
        setLoading("dns", false)
        return response
      })
      .catch((error) => {
        setLoading("dns", false)
        throw error
      })
  }

  function checkLicenseDns(payload) {
    return new Promise((resolve, reject) => {
      setLoading("dns", true)
      state.value.verificationStatus = "verifying"
      api
        .post(
          `${appApiUrl.value}licenses/${payload.license_id}/dns-check`,
          {},
          {
            headers: {
              "X-Account-ID": authStore.currentAccountId.toString(),
            },
          }
        )
        .then((response) => {
          if (response.data?.data) {
            state.value.dnsCheckData = response.data.data
            if (response.data.status === "verified") {
              state.value.verificationStatus = "verified"
            } else {
              state.value.verificationStatus = "failed"
            }
          }
          setLoading("dns", false)
          resolve(response)
        })
        .catch((error) => {
          state.value.verificationStatus = "failed"
          setLoading("dns", false)
          reject(error)
        })
    })
  }

  function detectLicenseOrigin(payload) {
    state.value.isDetectingOrigin = true
    state.value.originDetectionError = null
    setLoading("dns", true)
    return api
      .post(
        `${appApiUrl.value}licenses/${payload.license_id}/dns-check/detect-origin`,
        {},
        {
          headers: { "X-Account-ID": authStore.currentAccountId.toString() },
        }
      )
      .then((response) => {
        if (response.data.success) {
          state.value.detectedOriginIp = response.data.data.detected_ip
        } else {
          state.value.originDetectionError = response.data.error.message
        }
        return response
      })
      .catch((error) => {
        state.value.originDetectionError =
          error.response?.data?.error?.message || "Failed to detect origin IP."
        throw error
      })
      .finally(() => {
        state.value.isDetectingOrigin = false
        setLoading("dns", false)
      })
  }

  function checkLicenseOriginHealth(payload) {
    state.value.isCheckingHealth = true
    state.value.originHealthError = null
    return api
      .post(
        `${appApiUrl.value}licenses/${payload.license_id}/dns-check/origin-health`,
        {},
        {
          headers: {
            "X-Account-ID": authStore.currentAccountId.toString(),
          },
        }
      )
      .then((response) => {
        if (response.data.success) {
          state.value.originHealth = response.data.data
        } else {
          state.value.originHealthError = response.data.error.message
        }
        return response
      })
      .catch((error) => {
        state.value.originHealthError =
          error.response?.data?.error?.message ||
          "Failed to check origin health."
        throw error
      })
      .finally(() => {
        state.value.isCheckingHealth = false
      })
  }

  async function performDnsChecks(licenseId) {
    setLoading("dns", true)
    try {
      await Promise.all([
        checkLicenseDns({ license_id: licenseId }),
        detectLicenseOrigin({ license_id: licenseId }),
        checkLicenseOriginHealth({ license_id: licenseId }),
      ])
    } finally {
      setLoading("dns", false)
    }
  }

  return {
    state,
    getLicenses,
    getLicenseRules,
    addLicenseRule,
    updateLicenseRule,
    deleteLicenseRule,
    updateLicenseSettings,
    updateSingleLicenseSetting,
    updateLicenseDomain,
    checkLicenseDns,
    detectLicenseOrigin,
    checkLicenseOriginHealth,
    generateInstallationScript,
    enrichLanguages,
    performDnsChecks,
    startDnsConfiguration,
    stopDnsConfiguration,
    saveLicenseToWordPress
  }
})
