<template>
  <div>
    <span
      :class="['toggle-wrapper', wrapperStyles]"
      role="checkbox"
      :aria-checked="modelValue.toString()"
      tabindex="0"
      @click="toggle"
      @keydown.space.prevent="toggle"
    >
      <span
        class="toggle-background"
        :class="backgroundStyles"
      />
      <span
        class="toggle-indicator"
        :style="indicatorStyles" 
      />
    </span>
  </div>
</template>

<script>
  import { computed, watch } from 'vue'

  export default {
    name: 'LlSwitch',
    props: {
      modelValue:{
        type: Boolean,
        required: true
      },
      big: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue', 'update'],
    setup(props, { emit }) {
      //computed
      const wrapperStyles = computed(() => {
          return {
            'big': props.big
          }
      })
      const backgroundStyles = computed(() => {
          return {
            'gold-mid': props.modelValue,
            'gray-lighter': !props.modelValue
          }
      })
      const isOn = computed(() => {
        return props.modelValue
      })

      //methods
      const indicatorStyles = computed(() => {
        return { 
          transform: props.modelValue ? 'translateX(20px)' : 'translateX(0)',
          left: props.modelValue ? '12px' : '2px'
        }
      })

      function toggle() {
        emit('update:modelValue', !props.modelValue);
        emit('update')
      }

      return {
        backgroundStyles,
        wrapperStyles,
        indicatorStyles,
        toggle,
        isOn
      }
    }
  }
</script>

<style scoped>
  .gold-mid{
    background-color: var(--highlight-color);
  }

  .gray-lighter{
    background-color: #c2c2c2;
  }

  .toggle-wrapper {
    display: inline-block;
    position: relative;
    cursor: pointer;
    width: 40px;
    height: 20px;
    border-radius: 9999px;
  }

  .toggle-wrapper.big {
    width: 60px;
    height: 30px;
  }

  .toggle-wrapper:focus {
    outline: 0;
  }

  .toggle-background {
    display: inline-block;
    border-radius: 9999px;
    height: 100%;
    width: 100%;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background-color .4s ease;
  }

  .toggle-indicator {
    position: absolute;
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: var(--bg-secondary);
    border-radius: 9999px;
    box-shadow:  0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform .2s ease;
  }

  .toggle-wrapper.big .toggle-indicator{
    height: 26px;
    width: 26px;
  }

  #billing-term{
    display:initial!important;
  }
</style>