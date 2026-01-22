<template>
  <div class="input-wrapper">
    <label :for="$attrs.id" class="visually-hidden">{{ label }}</label>
    <input
      v-bind="$attrs"
      :type="type"
      v-model="inputValue"
      autocomplete="new-password"
    />
    <div class="append-slot"><slot name="append"></slot></div>
  </div>
</template>

<script>
export default {
  name: "LlInput",
  inheritAttrs: false,
}
</script>

<script setup>
import { computed } from "vue"

const props = defineProps({
  modelValue: String,
  type: {
    type: String,
    default: "text",
  },
  label: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
})
</script>

<style scoped>
.input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
}

input {
  padding: 0 15px;
  border: 1px solid black;
  border-radius: 4px;
  font-size: 16px;
  line-height: 16px;
  height: 40px;
  width: 100%;
  background-color: var(--bg-secondary);
  color: black;
}
.input-wrapper:has(.append-slot:not(:empty)) input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

input:hover {
  border-color: #aaaea6;
  transition: ease-in-out, border-color 0.15s ease-in-out;
}

input:focus {
  border-color: var(--accent-color);
  outline-style: none;
}

.append-slot:not(:empty) {
  display: flex;
}

.append-slot:not(:empty) :deep(button) {
  height: 40px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
