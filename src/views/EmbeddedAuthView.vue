<template>
  <div class="auth-container">
    <!-- The active component is controlled by v-show based on the activeTab data property -->
    <EmbeddedLogin v-show="activeTab === 'login'" @switch-to-register="activeTab = 'register'" />
    <EmbeddedRegister v-show="activeTab === 'register'" @switch-to-login="activeTab = 'login'" />
  </div>
</template>

<script>
import EmbeddedLogin from './EmbeddedLogin.vue';
import EmbeddedRegister from './EmbeddedRegister.vue';

export default {
  name: 'EmbeddedAuthView',
  components: {
    EmbeddedLogin,
    EmbeddedRegister,
  },
  data() {
    return {
      activeTab: 'login',
    };
  },
   created() {
    // Check for a query parameter to set the active tab on load.
    if (this.$route.query.tab === 'register') {
      this.activeTab = 'register';
    }
  },
};
</script>

<style scoped>
.auth-container {
}

.auth-tabs {
  display: flex;
  background-color: #f7f7f7;
  border-bottom: 1px solid #ccc;
}

.auth-tabs button {
  flex: 1;
  padding: 1rem;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  color: #555;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.auth-tabs button.active {
  color: #0073aa;
  border-bottom-color: #0073aa;
}

.auth-tabs button:hover:not(.active) {
  background-color: #e9e9e9;
}
</style>
