<template>
  <div class="form-container">
    <h3>Welcome Back!</h3>
    <p class="current-step-container">
      Login to manage your account.
    </p>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" v-model="email" required autocomplete="email" />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="password" required autocomplete="current-password" />
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <div class="forgot-password">
        <a href="https://weblinguist.ai/login/#/forgot-password" target="_blank">Forgot your password?</a>
      </div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    <div class="toggle-link">
      Don't have an account? <a href="#" @click.prevent="$emit('switchToRegister')">Register here</a>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from "../stores/auth"
import { useLicenseStore } from "../stores/license";

export default {
  name: 'EmbeddedLogin',
  emits: ['switchToRegister'],
  setup() {
    const authStore = useAuthStore()

    return { authStore }
  },
  data() {
    return {
      email: '',
      password: '',
      isLoading: false,
      errorMessage: '',
    };
  },
  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        await this.authStore.embeddedLogin({
          email: this.email,
          password: this.password,
        });

        const licenseStore = useLicenseStore();
        // After successful login, fetch licenses to find the active one.
        await licenseStore.getLicenses();

        const activeLicense = licenseStore.state.active_license;

        if (activeLicense) {
          // If an active license is found, go directly to its management page.
          this.$router.push({ name: 'manage-license', params: { id: activeLicense.id } });
        } else {
          // Otherwise, fall back to the default overview/welcome page.
          this.$router.push(this.$route.query.redirect || '/');
        }

      } catch (error) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          this.errorMessage = error.response.data.message;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'An unexpected error occurred. Please try again.';
        }
        console.error('Embedded login failed:', error);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
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
  margin-bottom: 24px!important;
  display: block;
  margin-block-end: 24px!important;
  margin-block-start: 14px!important;
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
.toggle-link {
  margin-top: 1.5rem;
  text-align: center;
}
form label {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-primary);
}
form input[type="email"],
form input[type="password"] {
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
form input[type="email"]:focus,
form input[type="password"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}
.error-message {
  color: red;
  margin-bottom: 1rem;
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
.forgot-password{
  display: flex;
  justify-content: flex-end;
}
@media screen and (max-width: 490px) {
  form {
    min-width: initial;
  }
}
</style>