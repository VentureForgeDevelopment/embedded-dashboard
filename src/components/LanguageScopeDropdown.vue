<template>
  <div class="language-scope-dropdown" ref="dropdownRef">
    <button
      type="button"
      class="dropdown-trigger"
      :class="{ active: isOpen, global: isGlobal }"
      @click="toggleDropdown"
    >
      <span class="dropdown-icon" v-html="currentIcon"></span>
      <span class="dropdown-label truncate-text" v-html="currentLabel"></span>
      <span class="dropdown-arrow">▼</span>
    </button>

    <div v-if="isOpen" class="dropdown-menu">
      <div class="dropdown-header">Select Target Language</div>

      <!-- Language Options -->
      <button
        v-for="lang in languages"
        :key="lang.code"
        type="button"
        class="dropdown-item"
        :class="{ selected: modelValue === lang.code }"
        @click="selectLanguage(lang.code)"
      > 
        <span class="item-icon" v-html="lang.flag || globalIcon"></span>
        <span class="item-label truncate-text">{{ lang.name }}</span> 
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLicenseStore } from '../stores/license'

const props = defineProps({
  modelValue: { 
    type: String,
    default: null
  },
  ruleType: {
    type: String,
    default: 'exclude'
  },
  availableLanguages: {
    type: Array,
    default: () => []
  }
})

const licenseStore = useLicenseStore()

const globalIcon = computed(() => {
  const defaultIconSet = licenseStore.state.icons.find(i => i.id === 'default');
  if (defaultIconSet) {
    const globeVariant = defaultIconSet.variants.find(v => v.name === 'globe');
    if (globeVariant) {
      return globeVariant.data;
    }
  }
  //fallback
  return '<svg xmlns="http://www.w3.org/2000/svg" class="icon globe-icon" width="24" height="24" viewBox="0 0 420 420" stroke="black" fill="none"><path stroke-width="26" d="M209,15a195,195 0 1,0 2,0z"/><path stroke-width="26" d="m210,15v390m195-195H15M59,90a260,260 0 0,0 302,0 m0,240 a260,260 0 0,0-302,0M195,20a250,250 0 0,0 0,382 m30,0 a250,250 0 0,0 0-382"/></svg>'; // Fallback emoji
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const dropdownRef = ref(null)
const languages = computed(() => props.availableLanguages)

const isGlobal = computed(() => props.modelValue === 'global')

const currentIcon = computed(() => {
  const lang = languages.value.find(l => l.code === props.modelValue)
  if (lang && lang.flag) {
    return lang.flag
  }
  if (props.modelValue === 'global') {
    return globalIcon.value
  }

  // Default fallback
  return '<svg xmlns="http://www.w3.org/2000/svg" class="icon globe-icon" width="24" height="24" viewBox="0 0 420 420" stroke="black" fill="none"><path stroke-width="26" d="M209,15a195,195 0 1,0 2,0z"/><path stroke-width="26" d="m210,15v390m195-195H15M59,90a260,260 0 0,0 302,0 m0,240 a260,260 0 0,0-302,0M195,20a250,250 0 0,0 0,382 m30,0 a250,250 0 0,0 0-382"/></svg>';
})

const currentLabel = computed(() => {
  const lang = languages.value.find(l => l.code === props.modelValue)
  return lang ? `${lang.name}` : 'Select...'
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectLanguage = (code) => {
  emit('update:modelValue', code)
  isOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.language-scope-dropdown {
  position: relative;
  display: inline-block;
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.6rem 0.875rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.dropdown-trigger:hover {
  border-color: var(--accent-color);
  background: var(--bg-hover);
}

.dropdown-trigger.active {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dropdown-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropdown-icon:deep(svg) {
  width: 20px;
  height: auto;
  line-height: 1;
}

.dropdown-label {
  flex: 1;
}

.dropdown-arrow {
  font-size: 0.7rem;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.dropdown-trigger.active .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  padding: 0.5rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.25rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 0.875rem;
  background: white;
  border: none;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-item.selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: var(--accent-color);
  font-weight: 600;
}

.item-icon {
  font-size: 1.2rem;
  line-height: 1;
  flex-shrink: 0;
}
.item-icon:deep(svg) {
  width: 20px;
  height: auto;
}

.item-label {
  flex: 1;
}

/* Scrollbar styling */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 0 8px 8px 0;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: var(--accent-color);
}


@media (max-width: 679px) {
  .dropdown-header{
    
  }
  .dropdown-item .item-label {
    
  }
  .dropdown-trigger .dropdown-label {
    
  }
}
</style>
