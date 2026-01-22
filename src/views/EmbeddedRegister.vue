<template>
  <div class="registration-layout">
    <WalkthroughContainer 
      mode="static"
      :static-steps="['Sign Up', 'Setup Your Plan', 'Translate Your Website']"
      :current-static-step-index="0"
    />
    <div class="form-container">
      <h3>Create an Account to Get Started</h3>
      <p class="current-step-container">
        Step 1 of 3: Sign Up
      </p>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" v-model="email" required autocomplete="email" />
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Creating Account...' : 'Register' }}
        </button>
      </form>
      <div class="toggle-link">
        Already have an account? <a href="#" @click.prevent="$emit('switchToLogin')">Login here</a>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from "../stores/auth"
import WalkthroughContainer from '../components/Checkout/partials/WalkthroughContainer.vue';

export default {
  name: 'EmbeddedRegister',
  components: { WalkthroughContainer },
  emits: ['switchToLogin'],
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  data() {
    return {
      name: 'user',
      email: '',
      isLoading: false,
      errorMessage: '',
    };
  },
  methods: {
    async handleRegister() {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        await this.authStore.embeddedRegister({
          name: this.name,
          email: this.email,
        });

        // On success, redirect to the dashboard home or the intended page.
        this.$router.push({
          name: "checkout"
        });

      } catch (error) {
        if (error.response?.data?.errors) {
            // Handle Laravel validation errors (e.g., email already taken)
            this.errorMessage = Object.values(error.response.data.errors).flat().join(' ');
        } else if (error.response?.data?.message) {
            this.errorMessage = error.response.data.message;
        } else if (error.message) {
            this.errorMessage = error.message;
        } else {
            this.errorMessage = 'An unexpected error occurred. Please try again.';
        }
        console.error('Embedded registration failed:', error);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.registration-layout {
  display: grid;
  grid-template-columns: 40% 60%;
  width: 100%;
  height: 100%;
  min-height: 80vh; /* Ensure it takes up space */
}
.form-container {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center; /* Center form horizontally */
  background-color: var(--bg-secondary);
}
h3 {
  font-size: 24px;
  font-family: "Work Sans", sans-serif;
  margin-top: 0;
  margin-bottom: 0;
  text-align: center;
  font-weight: 300;
  color: var(--text-primary);
}
.current-step-container {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 24px;
  display: block;
  margin-block-end: 24px;
  margin-block-start: 14px;
  text-align: center;
  color: var(--text-secondary);
}
form {
  min-width: 400px;
}
.form-group {
  margin-bottom: 1rem;
  text-align: left;
}
form label {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-primary);
}
form input[type="text"],
form input[type="email"] {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
  height: 38px;
  margin-top: 0.5rem;
  transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
}
form input[type="text"]:focus,
form input[type="email"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}
form button[type="submit"] {
  font-size: 16px;
  width: 100%;
  font-weight: bold;
  color: #ffffff;
  box-shadow: 3px 3px 3px 2px rgba(0, 0, 0, 0.09);
  border-radius: 25px;
  padding: 10px 30px;
  cursor: pointer;
  background-color: rgba(242, 5, 203, 1);
  transition: all 0.2s ease;
  border: none;
  margin-top: 20px;
}
form button[type="submit"]:hover {
  transform: translateY(-1px);
}
form button[type="submit"]:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.toggle-link {
  margin-top: 1.5rem;
  text-align: center;
}
@media screen and (max-width: 769px) {
  .registration-layout {
    grid-template-columns: 1fr;
  }
}
@media screen and (max-width: 490px) {
  form {
    min-width: initial;
  }
}
</style>