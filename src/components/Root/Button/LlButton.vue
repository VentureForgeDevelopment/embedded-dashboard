<template>
  <button
    class="ll-button"
    @click="handleClick"
    :disabled="disabled"
    :autofocus="autofocus"
    :type="nativeType"
    :class="[
      type ? 'll-button--' + type : ''
    ]"
  >
    <i :class="icon" v-if="icon && !loading" @click="handleInnerClick"></i>
    <span v-if="$slots.default" @click="handleInnerClick"><slot></slot></span>
  </button>
</template>
<script>
import { computed, inject, getCurrentInstance } from 'vue';

export default {
  name: 'LlButton',
  props: {
    type: {
      type: String,
      default: 'default'
    },
    size: String,
    icon: {
      type: String,
      default: ''
    },
    nativeType: {
      type: String,
      default: 'button'
    },
    loading: Boolean,
    disabled: Boolean,
    plain: Boolean,
    autofocus: Boolean,
    round: Boolean
  },
  emits: ['click'],
  setup(props, { emit }) {
    const elFormItem = inject('elFormItem', '');
    const instance = getCurrentInstance();

    const _llFormItemSize = computed(() => (elFormItem || {}).llFormItemSize);
    const buttonSize = computed(() => props.size || _llFormItemSize.value || (instance.appContext.config.globalProperties.$ELEMENT || {}).size);

    function handleClick(evt) {
      emit('click', evt);
    }

    function handleInnerClick(evt) {
      if (props.disabled) {
        evt.stopPropagation();
      }
    }

    return {
      handleClick,
      handleInnerClick,
      buttonSize
    };
  },
}
</script>

<style scoped>

.ll-button--default {
  color: black;
  padding: 8px 20px;
  margin: 4px;
  border: 1px solid;
  border-radius: 4px;
  border-color: #d8dce5;
  background-color: white;
}

.ll-button--selected{
  padding: 7.5px;
  margin: 4px;
  border: 1px solid;
  color: black;
  border-radius: 4px;
  border-color: #d8dce5;
  background-color: white;
  font-weight: bolder;
  position: relative;
}

.ll-button--selected:hover{
  border: 1px solid;
  border-radius: 4px;
  color:#27ae60;
  border-color: #27ae60;
  font-weight: bolder;
}

.ll-button--default:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.ll-button--text {
  border: none;
  background-color: transparent;
}

.ll-button--primary {
  background-color: rgb(58, 142, 230);
  padding: 8px 20px;
  margin: 4px;
  border: 1px solid;
  border-radius: 4px;
  border-color: #d8dce5;
  color: white;
}

.ll-button--primary:hover {
  background: #66b1ff;
  border-color: #66b1ff;
  color: white;
}

.ll-button--danger {
  background-color: #fa5555;
  padding: 8px 20px;
  margin: 4px;
  border: 1px solid;
  border-radius: 4px;
  border-color: #fa5555;
  color: white;
}

.ll-button--danger:hover {
  background: #fb7777;
  border-color: #fb7777;
  color: white;
}

.ll-button--open-link {
  border: none!important;
  padding: 4px;
  background-color: #00000000;
}

/* .ll-button {
  color: white;
  background-color: rgba( 0, 0, 0, 0 );
  border: none;
}

.ll-button .main-menu-close {
  color: red!important;
  background-color: rgba( 0, 0, 0, 0 );
  border: none!important;
}

.ll-button .main-menu-close:hover {
  color: red;
  background-color: rgba( 0, 0, 0, 0 );
  border: none;
} */

</style>