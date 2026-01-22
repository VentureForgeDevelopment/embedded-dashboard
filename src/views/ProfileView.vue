<script setup>
import { ref, reactive, onMounted } from "vue"
import { useAuthStore } from "../stores/auth"
import api from "../utils/api"
import CheckCircleIcon from "vue-material-design-icons/CheckCircle.vue"

const authStore = useAuthStore()

const profileForm = ref({
  name: authStore.user?.name || "",
  email: authStore.user?.email || "",
  paypal_email: authStore.user?.paypal_email || "",
})

const passwordForm = ref({
  current_password: "",
  new_password: "",
  new_password_confirmation: "",
})

const isEditing = ref(false)
const isUpdatingProfile = ref(false)
const isUpdatingPassword = ref(false)

const profileError = ref("")
const profileSuccess = ref("")
const passwordError = ref("")
const passwordSuccess = ref("")

// Default Account state
const userAccounts = ref([])
const defaultAccountId = ref(null)
const isUpdatingDefaultAccount = ref(false)
const defaultAccountError = ref("")
const defaultAccountSuccess = ref("")

const saveProfile = async () => {
  if (!profileForm.value.name || !profileForm.value.email) {
    profileError.value = "Name and email are required"
    return
  }

  isUpdatingProfile.value = true
  profileError.value = ""
  profileSuccess.value = ""

  try {
    const response = await api.put("user/profile", {
      name: profileForm.value.name,
      email: profileForm.value.email,
      paypal_email: profileForm.value.paypal_email,
    })

    if (response.data?.success === 1) {
      // Update the auth store with new user data
      authStore.user = response.data.user
      profileSuccess.value = "Profile updated successfully"
      isEditing.value = false
    } else {
      profileError.value = response.data.error || "Failed to update profile"
    }
  } catch (error) {
    if (error.isCSRFError) {
      profileError.value = error.message
    } else if (error.response?.data?.errors) {
      const errors = Object.values(error.response.data.errors).flat()
      profileError.value = errors.join(", ")
    } else {
      profileError.value =
        error.response?.data?.error ||
        error.message ||
        "Failed to update profile"
    }
  } finally {
    isUpdatingProfile.value = false
  }
}

const updatePassword = async () => {
  if (
    !passwordForm.value.current_password ||
    !passwordForm.value.new_password ||
    !passwordForm.value.new_password_confirmation
  ) {
    passwordError.value = "All password fields are required"
    return
  }

  if (
    passwordForm.value.new_password !==
    passwordForm.value.new_password_confirmation
  ) {
    passwordError.value = "New passwords do not match"
    return
  }

  if (passwordForm.value.new_password.length < 8) {
    passwordError.value = "New password must be at least 8 characters"
    return
  }

  isUpdatingPassword.value = true
  passwordError.value = ""
  passwordSuccess.value = ""

  try {
    const response = await api.put("user/password", {
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password,
      new_password_confirmation: passwordForm.value.new_password_confirmation,
    })

    if (response.data?.success === 1) {
      passwordSuccess.value = "Password updated successfully"
      // Clear password form
      passwordForm.value = {
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      }
    } else {
      passwordError.value = response.data.error || "Failed to update password"
    }
  } catch (error) {
    if (error.isCSRFError) {
      passwordError.value = error.message
    } else if (error.response?.data?.errors) {
      const errors = Object.values(error.response.data.errors).flat()
      passwordError.value = errors.join(", ")
    } else {
      passwordError.value =
        error.response?.data?.error ||
        error.message ||
        "Failed to update password"
    }
  } finally {
    isUpdatingPassword.value = false
  }
}

const cancelEdit = () => {
  profileForm.value.name = authStore.user?.name || ""
  profileForm.value.email = authStore.user?.email || ""
  profileForm.value.paypal_email = authStore.user?.paypal_email || ""
  isEditing.value = false
  profileError.value = ""
  profileSuccess.value = ""
}

// Load user accounts for default account selection
const loadUserAccounts = async () => {
  try {
    const response = await authStore.getUserAccounts()
    if (response.success) {
      userAccounts.value = response.accounts
      // Find user's current default account
      defaultAccountId.value =
        authStore.user?.default_account_id || authStore.user?.account_id || null
    }
  } catch (error) {
    console.error("Error loading user accounts:", error)
  }
}

// Update user's default account
const updateDefaultAccount = async () => {
  if (!defaultAccountId.value) return

  isUpdatingDefaultAccount.value = true
  defaultAccountError.value = ""
  defaultAccountSuccess.value = ""

  try {
    const response = await api.put("user/default-account", {
      default_account_id: defaultAccountId.value,
    })

    if (response.data.success === 1) {
      // Update the auth store with new user data
      authStore.user = response.data.user
      defaultAccountSuccess.value = "Default account updated successfully"
    } else {
      defaultAccountError.value =
        response.data.error || "Failed to update default account"
    }
  } catch (error) {
    if (error.isCSRFError) {
      defaultAccountError.value = error.message
    } else {
      defaultAccountError.value =
        error.response?.data?.error ||
        error.message ||
        "Failed to update default account"
    }
  } finally {
    isUpdatingDefaultAccount.value = false
  }
}

const linkWithGoogle = () => {
  authStore.linkWithGoogle()
}

const linkWithMicrosoft = () => {
  authStore.linkWithMicrosoft()
}

// Initialize form data when component mounts
onMounted(() => {
  if (authStore.user) {
    profileForm.value.name = authStore.user.name || ""
    profileForm.value.email = authStore.user.email || ""
    profileForm.value.paypal_email = authStore.user.paypal_email || ""
  }
  // Load user accounts for default account selection
  loadUserAccounts()
})
</script>

<template>
  <div class="profile-container padding max-1200">
    <h2 class="page-title">Profile Settings</h2>

    <!-- Profile Information -->
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar">
          <div class="avatar-circle">
            {{ authStore.userInitials }}
          </div>
        </div>
        <div class="profile-info">
          <h3 class="profile-name">{{ authStore.user?.name || "User" }}</h3>
          <p class="profile-email">{{ authStore.user?.email || "" }}</p>
          <p class="profile-role">
            {{ authStore.user?.access_level || "User" }}
          </p>
        </div>
        <!-- Social Login Buttons -->
        <div class="social-buttons">
          <div>
            <button
              type="button"
              class="social-button google btn btn-outline-danger"
              @click="linkWithGoogle()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            <CheckCircleIcon
              v-if="authStore.user?.google_id"
              fill-color="var(--success-green)"
              style="
                display: inline-flex;
                justify-content: center;
                align-items: center;
                margin-right: 0.5rem;
              "
            />
          </div>
          <div>
            <button
              type="button"
              class="social-button microsoft btn btn-outline-primary"
              @click="linkWithMicrosoft()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#f25022" d="M11.4 11.4H.6V.6h10.8v10.8z" />
                <path fill="#00a4ef" d="M23.4 11.4H12.6V.6h10.8v10.8z" />
                <path fill="#7fba00" d="M11.4 23.4H.6V12.6h10.8v10.8z" />
                <path fill="#ffb900" d="M23.4 23.4H12.6V12.6h10.8v10.8z" />
              </svg>
              Microsoft
            </button>

            <CheckCircleIcon
              v-if="authStore.user?.microsoft_id"
              fill-color="var(--success-green)"
              style="
                display: inline-flex;
                justify-content: center;
                align-items: center;
                margin-right: 0.5rem;
              "
            />

          </div>
        </div>
      </div>
    </div>

    <!-- Settings Grid -->
    <div class="settings-grid">
      <!-- Personal Information -->
      <div class="settings-card">
        <div class="card-header">
          <h3 class="card-title">Personal Information</h3>
          <button
            v-if="!isEditing"
            @click="isEditing = true"
            class="btn btn-outline"
          >
            Edit
          </button>
          <div v-else class="edit-buttons">
            <button
              @click="saveProfile"
              :disabled="isUpdatingProfile"
              class="btn btn-primary"
            >
              <span v-if="isUpdatingProfile" class="spinner"></span>
              {{ isUpdatingProfile ? "Saving..." : "Save" }}
            </button>
            <button
              @click="cancelEdit"
              :disabled="isUpdatingProfile"
              class="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Profile Success/Error Messages -->
        <div v-if="profileError" class="alert alert-error">
          {{ profileError }}
        </div>
        <div v-if="profileSuccess" class="alert alert-success">
          {{ profileSuccess }}
        </div>

        <form @submit.prevent="saveProfile" v-if="isEditing">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input
                v-model="profileForm.name"
                class="form-input"
                type="text"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input
                v-model="profileForm.email"
                class="form-input"
                type="email"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">PayPal Email</label>
              <input
                v-model="profileForm.paypal_email"
                class="form-input"
                type="email"
                placeholder="Enter your PayPal email"
              />
            </div>
          </div>
        </form>

        <div v-else class="form-grid">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input
              v-model="profileForm.name"
              disabled
              class="form-input"
              type="text"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input
              v-model="profileForm.email"
              disabled
              class="form-input"
              type="email"
            />
          </div>
          <div class="form-group">
            <label class="form-label">PayPal Email</label>
            <input
              v-model="profileForm.paypal_email"
              disabled
              class="form-input"
              type="email"
            />
          </div>
          
        </div>
      </div>

      <!-- Security Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h3 class="card-title">Security</h3>
        </div>

        <!-- Password Success/Error Messages -->
        <div v-if="passwordError" class="alert alert-error">
          {{ passwordError }}
        </div>
        <div v-if="passwordSuccess" class="alert alert-success">
          {{ passwordSuccess }}
        </div>

        <form @submit.prevent="updatePassword">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input
                v-model="passwordForm.current_password"
                class="form-input"
                type="password"
                placeholder="Enter current password"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input
                v-model="passwordForm.new_password"
                class="form-input"
                type="password"
                placeholder="Enter new password (min 8 characters)"
                minlength="8"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              <input
                v-model="passwordForm.new_password_confirmation"
                class="form-input"
                type="password"
                placeholder="Confirm new password"
                minlength="8"
                required
              />
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              :disabled="isUpdatingPassword"
              class="btn btn-primary"
            >
              <span v-if="isUpdatingPassword" class="spinner"></span>
              {{ isUpdatingPassword ? "Updating..." : "Update Password" }}
            </button>
          </div>
        </form>
      </div>

      <!-- Default Account Settings -->
      <div class="settings-card" v-if="userAccounts.length > 1">
        <div class="card-header">
          <h3 class="card-title">Default Account</h3>
        </div>

        <!-- Default Account Success/Error Messages -->
        <div v-if="defaultAccountError" class="alert alert-error">
          {{ defaultAccountError }}
        </div>
        <div v-if="defaultAccountSuccess" class="alert alert-success">
          {{ defaultAccountSuccess }}
        </div>

        <div class="form-group">
          <label class="form-label">Select your default account</label>
          <p class="form-help">
            This account will be selected when you log in.
          </p>
          <select
            v-model="defaultAccountId"
            @change="updateDefaultAccount"
            :disabled="isUpdatingDefaultAccount"
            class="form-select"
          >
            <option value="" disabled>Choose default account</option>
            <option
              v-for="account in userAccounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.name }} ({{ account.access_level }})
            </option>
          </select>

          <div v-if="isUpdatingDefaultAccount" class="updating-indicator">
            <span class="spinner"></span>
            Updating default account...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  animation: fadeIn 0.3s ease;
  width: 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2rem 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.profile-card,
.settings-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.profile-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.profile-email {
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.profile-role {
  color: var(--accent-color);
  font-weight: 500;
  margin: 0;
  text-transform: capitalize;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.edit-buttons {
  display: flex;
  gap: 0.75rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-input:disabled {
  background: var(--bg-hover);
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-secondary {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-outline {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
}

/* Alert Messages */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.alert-error {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.alert-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

/* Loading Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s ease;
  cursor: pointer;
}

.form-select:hover:not(:disabled) {
  border-color: var(--accent-color);
}

.form-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-hover);
}

.form-help {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0.75rem 0;
}

.updating-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}


div.social-buttons {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  font-size: 16px;
  font-weight: 400;
  gap: 10px;
}

div.social-buttons div {
  width: 100%;
  display: flex;
  gap: 10px;
}

div.social-buttons div button{
  width: 150px;
  display: flex;
  gap: 10px;
}

.btn-outline-danger {
  border-width: 1px !important;
  color: #dc3545 !important;
  border: 1px solid #dc3545 !important;
  background-color: transparent !important;
  text-shadow: none !important;
  box-shadow: none !important;
}

.btn-outline-danger:hover {
  color: #fff !important;
  background-color: #dc3545 !important;
  border-color: #dc3545 !important;
  text-shadow: none !important;
  box-shadow: none !important;
}

.btn-outline-primary {
  color: #0d6efd !important;
  border: 1px solid #0d6efd !important;
  background-color: transparent !important;
  text-shadow: none !important;
  box-shadow: none !important;
}

.btn-outline-primary:hover {
  color: #fff !important;
  background-color: #0d6efd !important;
  border-color: #0d6efd !important;
  text-shadow: none !important;
  box-shadow: none !important;
}


@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .danger-item {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
