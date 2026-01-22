<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useAuthStore } from "../stores/auth"
import { useAccountStore } from "../stores/account"
import { useThemeStore } from "../stores/theme"
import { useLicenseStore } from "../stores/license"
import AccountSwitcher from "../components/AccountSwitcher.vue"
import Notifications from "../components/Notifications/Notifications.vue"
import ChartBox from "vue-material-design-icons/ChartBox.vue"
import Laptop from "vue-material-design-icons/Laptop.vue"
import CreditCard from "vue-material-design-icons/CreditCard.vue"
import Bell from "vue-material-design-icons/Bell.vue"
import Gift from "vue-material-design-icons/Gift.vue"
import AccountCircle from "vue-material-design-icons/AccountCircle.vue"
import Pencil from "vue-material-design-icons/Pencil.vue"
import AccountGroup from "vue-material-design-icons/AccountGroup.vue"
import Logout from "vue-material-design-icons/Logout.vue"
import RocketLaunchOutline from "vue-material-design-icons/RocketLaunchOutline.vue"
import Menu from "vue-material-design-icons/Menu.vue"

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const accountStore = useAccountStore()
const themeStore = useThemeStore()
const licenseStore = useLicenseStore()

const webLinguistLogo = new URL(
  "../assets/images/weblinguist-logo.png",
  import.meta.url
).href
const webLinguistTextLogo = new URL(
  "../assets/images/weblinguist-text-logo.png",
  import.meta.url
).href

const isEmbedded = computed(() => {
  return themeStore.isEmbedded
})

const activeLicense = computed(() => {
  return licenseStore.state.active_license
})

const user = computed(() => {
  return authStore.user
})

const referrals = computed(() => {
  return authStore.referrals
})

const showAdvancedTabs = computed(() => {
  const hasAffiliateSignupFlag =
    user.value?.flags?.includes("affiliate_signup") ||
    user.value?.flags?.includes("agency_signup") ||
    user.value?.flags?.includes("webinar_signup")

  const hasReferrals = (referrals.value?.length || 0) > 0

  return hasAffiliateSignupFlag || hasReferrals
})

// Dropdown state
const isUserMenuOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isNotificationModalOpen = computed(() => {
  return themeStore.modalOpen
})

const hasUnreadNotifications = computed(() => {
  return accountStore.state.notifications.some(
    (n) => !n.viewed && n.viewed !== 1
  )
})

// Check if nav item is active
const isActiveRoute = (path) => {
  // Handle exact match for root path '/'
  if (path === "/") {
    return route.path === path
  }
  // Check if the current route starts with the nav item's path
  return route.path.startsWith(path)
}

const hideElement = computed(() => {
  if (isActiveRoute("/checkout") && !authStore.initialOnboardComplete) {
    return true
  }
  return false
})

// Handle logout
const handleLogout = async () => {
  await authStore.logout()
}

// Close dropdown when clicking outside
const closeDropdown = (event) => {
  if (!event.target.closest(".user-menu-container")) {
    isUserMenuOpen.value = false
  }
}

const closeMobileMenu = (event) => {
  if (!event.target.closest(".mobile-menu-container, .mobile-menu-button")) {
    isMobileMenuOpen.value = false
  }
}

function toggleModal() {
  themeStore.toggleModal()
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

onMounted(() => {
  document.addEventListener("click", closeDropdown)
  document.addEventListener("click", closeMobileMenu)
  authStore.getReferrals()
})

onUnmounted(() => {
  document.removeEventListener("click", closeDropdown)
  document.removeEventListener("click", closeMobileMenu)
})
</script>

<template>
  <div class="dashboard-layout">
    <!-- Top Navigation -->
    <nav class="top-nav">
      <div class="nav-container">
        <!-- Left: Site Name -->
        <div class="nav-left">
          <router-link to="/">
            <img
              :src="webLinguistLogo"
              alt="WebLinguist Logo"
              class="site-logo site-logo-icon"
            />
            <img
              :src="webLinguistTextLogo"
              alt="WebLinguist Logo"
              class="site-logo site-logo-text"
            />
          </router-link>
        </div>

        <!-- Center: Navigation Links -->
        <div class="nav-center">
          <!-- Default Nav Links -->
          <template v-if="!isEmbedded">
            <router-link
              v-show="!hideElement"
              to="/"
              class="nav-link"
              :class="{ active: isActiveRoute('/') }"
            >
              <ChartBox
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Overview
            </router-link>

            <router-link
              v-show="!hideElement"
              to="/websites"
              class="nav-link"
              :class="{ active: isActiveRoute('/websites') }"
            >
              <Laptop
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Websites
            </router-link>

            <router-link
              v-show="!hideElement"
              to="/referrals"
              class="nav-link"
              :class="{ active: isActiveRoute('/referrals') }"
            >
              <Gift
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Affiliates
            </router-link>

            <router-link
              v-show="!hideElement && showAdvancedTabs"
              to="/agency"
              class="nav-link"
              :class="{ active: isActiveRoute('/agency') }"
            >
              <RocketLaunchOutline
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Agency
            </router-link>
          </template>
          <!-- Embedded Nav Links -->
          <template v-if="isEmbedded && user">
            <router-link
              :to="
                activeLicense ? `/websites/${activeLicense.id}` : '/welcome'
              "
              class="nav-link"
              :class="{ active: isActiveRoute('/websites') }"
            >
              <Laptop
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Customize
            </router-link>
            <router-link
              :to="
                activeLicense && activeLicense.subscription_id
                  ? `/subscriptions/${activeLicense.subscription_id}`
                  : '/welcome'
              "
              class="nav-link"
              :class="{ active: isActiveRoute('/subscriptions') }"
            >
              <CreditCard
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Billing
            </router-link>
            <a
              href="https://weblinguist.ai/affiliates/"
              target="_blank"
              class="nav-link"
            >
              <Gift
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Affiliates
            </a>
          </template>
        </div>

        <!-- Right: User Menu -->
        <div class="nav-right">
          <!-- Hamburger Menu Button -->
          <button
            @click.stop="toggleMobileMenu"
            class="mobile-menu-button"
            title="Open menu"
          >
            <Menu
              class="mobile-menu-icon"
              size="28"
              style="
                display: inline-flex;
                justify-content: center;
                align-items: center;
              "
            />
          </button>

          <!-- Dark Mode Toggle -->
          <!-- <button
            @click="themeStore.toggleDarkMode"
            class="dark-mode-toggle"
            :title="themeStore.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <span v-if="themeStore.isDarkMode">☀️</span>
            <span v-else>🌙</span>
          </button> -->

          <!-- Notifications Button -->
          <button
            v-if="user"
            v-show="!hideElement"
            @click="toggleModal"
            class="notification-button"
            title="View notifications"
          >
            <Bell
              class="notification-icon"
              style="
                display: inline-flex;
                justify-content: center;
                align-items: center;
              "
            />
            <span
              v-if="hasUnreadNotifications"
              class="notification-badge"
            ></span>
          </button>

          <!-- Notification Modal -->
          <transition name="dropdown">
            <div
              v-if="isNotificationModalOpen"
              class="modal-overlay"
              @click.self="toggleModal"
            >
              <div class="modal-content">
                <button
                  @click="toggleModal"
                  class="modal-close-button"
                  title="Close"
                >
                  &times;
                </button>
                <Notifications />
              </div>
            </div>
          </transition>

          <!-- User Menu -->
          <div
            v-if="!isEmbedded"
            :class="['user-menu-container', { 'hide-element': hideElement }]"
          >
            <button
              @click.stop="isUserMenuOpen = !isUserMenuOpen"
              class="user-button"
            >
              <div class="user-avatar">
                {{ authStore.userInitials }}
              </div>
            </button>

            <!-- Dropdown Menu -->
            <transition name="dropdown">
              <div v-if="isUserMenuOpen" class="dropdown-menu">
                <!-- User Info -->
                <div class="dropdown-header">
                  <div class="user-info">
                    <div class="user-name">
                      {{ authStore.user?.name || "User" }}
                    </div>
                    <div class="user-email">
                      {{ authStore.user?.email || "" }}
                    </div>
                  </div>
                </div>

                <div class="dropdown-divider"></div>

                <!-- Profile Section -->
                <router-link
                  to="/profile"
                  class="dropdown-item"
                  @click="isUserMenuOpen = false"
                >
                  <AccountCircle
                    style="
                      display: inline-flex;
                      justify-content: center;
                      align-items: center;
                    "
                  />

                  Profile
                </router-link>

                <div class="dropdown-divider"></div>

                <!-- Account Section -->
                <div class="dropdown-section">
                  <div class="dropdown-section-title">Account</div>
                  <router-link
                    to="/subscriptions"
                    class="dropdown-item"
                    @click="isUserMenuOpen = false"
                  >
                    <CreditCard
                      class="nav-icon"
                      style="
                        display: inline-flex;
                        justify-content: center;
                        align-items: center;
                      "
                    />
                    Billing
                  </router-link>
                  <router-link
                    to="/edit-account"
                    class="dropdown-item"
                    @click="isUserMenuOpen = false"
                  >
                    <Pencil
                      style="
                        display: inline-flex;
                        justify-content: center;
                        align-items: center;
                      "
                    />
                    Edit Account
                  </router-link>
                  <router-link
                    to="/manage-users"
                    class="dropdown-item"
                    @click="isUserMenuOpen = false"
                  >
                    <AccountGroup
                      style="
                        display: inline-flex;
                        justify-content: center;
                        align-items: center;
                      "
                    />
                    Manage Users
                  </router-link>
                </div>

                <div class="dropdown-divider"></div>

                <!-- Account Switcher -->
                <AccountSwitcher />

                <div class="dropdown-divider"></div>

                <!-- Logout -->
                <button @click="handleLogout" class="dropdown-item logout-item">
                  <Logout
                    style="
                      display: inline-flex;
                      justify-content: center;
                      align-items: center;
                    "
                  />
                  Logout
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mobile Flyout Menu -->
    <transition name="slide" mode="out-in">
      <div v-if="isMobileMenuOpen" class="mobile-menu-container">
        <div class="mobile-menu-header">
          <img
            :src="webLinguistTextLogo"
            alt="WebLinguist Logo"
            class="mobile-menu-logo"
          />
          <button
            @click="toggleMobileMenu"
            class="mobile-menu-close-button"
            title="Close"
          >
            &times;
          </button>
        </div>
        <div class="mobile-menu-links">
          <!-- Default Mobile Nav Links -->
          <template v-if="!isEmbedded">
            <router-link
              to="/"
              class="nav-link"
              :class="{ active: isActiveRoute('/') }"
              @click="toggleMobileMenu"
            >
              <ChartBox
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Overview
            </router-link>

            <router-link
              to="/websites"
              class="nav-link"
              :class="{ active: isActiveRoute('/websites') }"
              @click="toggleMobileMenu"
            >
              <Laptop
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Websites
            </router-link>

            <router-link
              to="/referrals"
              class="nav-link"
              :class="{ active: isActiveRoute('/referrals') }"
              @click="toggleMobileMenu"
            >
              <Gift
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Affiliates
            </router-link>

            <router-link
              v-if="showAdvancedTabs"
              to="/agency"
              class="nav-link"
              :class="{ active: isActiveRoute('/agency') }"
              @click="toggleMobileMenu"
            >
              <RocketLaunchOutline
                class="nav-icon"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
              Agency
            </router-link>
          </template>
          <!-- Embedded Mobile Nav Links -->
          <template v-if="isEmbedded && user">
            <router-link
              :to="
                activeLicense ? `/websites/${activeLicense.id}` : '/welcome'
              "
              class="nav-link"
              :class="{ active: isActiveRoute('/websites') }"
              @click="toggleMobileMenu"
            >
              <Laptop class="nav-icon" />
              Customize
            </router-link>
            <router-link
              :to="
                activeLicense
                  ? `/subscriptions/${activeLicense.subscription_id}`
                  : '/welcome'
              "
              class="nav-link"
              :class="{ active: isActiveRoute('/subscriptions') }"
              @click="toggleMobileMenu"
            >
              <CreditCard class="nav-icon" />
              Billing
            </router-link>
            <a
              href="https://weblinguist.ai/affiliates/"
              target="_blank"
              class="nav-link"
              @click="toggleMobileMenu"
            >
              <Gift class="nav-icon" />
              Affiliates
            </a>
          </template>
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div
        v-if="isMobileMenuOpen"
        class="mobile-menu-overlay"
        @click="toggleMobileMenu"
      ></div>
    </transition>

    <!-- Main Content Area -->
    <main class="main-content">
      <div>
        <router-view />
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <p class="footer-text">
          © {{ new Date().getFullYear() }} Growth Dynamics, LLC. All rights
          reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
  display: flex;
  flex-direction: column;
  position:relative;
}

/* CSS Variables for theming */
:root {
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-hover: #f0f0f0;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.15);
  --accent-color: #667eea;
}

.dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-hover: #3a3a3a;
  --text-primary: #f5f5f5;
  --text-secondary: #a0a0a0;
  --border-color: #404040;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.5);
}

/* Top Navigation */
.top-nav {
  background: var(--bg-header-footer);
  border-top: 1px solid #05c7f2;
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  left: 0;
  right: 0;
}

.nav-container {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 2rem;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Navigation Sections */
.nav-left {
  display: flex;
  justify-content: center;
  align-items: center;
}

.site-logo {
  object-fit: contain;
  vertical-align: middle;
}

.site-logo-icon {
  display: block;
  width: 56px;
  height: 56px;
}

.site-logo-text {
  display: none;
}

.mobile-menu-header .site-logo {
  width: 150px;
  /* background-image is now handled by an <img> tag */
}
.mobile-menu-button {
  display: none; /* Hidden by default */
  background: none;
  border: none;
  cursor: pointer;
}
.site-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-color);
  margin: 0;
  letter-spacing: -0.5px;
}

.nav-center {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  color: var(--text-tertiary);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.nav-link:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--highlight-color);
  color: white;
}

.nav-link:focus,
.nav-link:focus-within {
  outline: 2px solid var(--highlight-color) !important;
}

.nav-icon {
  font-size: 1.1rem;
}

.nav-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Notification Button */
.notification-button {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.notification-icon {
  font-size: 1.5rem;
  color: var(--text-tertiary);
}
.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background-color: #dc3545;
  border-radius: 50%;
  border: 1px solid var(--bg-secondary);
}

/* Modal Styles */
.modal-overlay,
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.modal-content {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 850px;
  position: relative;
  max-height: 80vh;
  min-height: 60vh;
  overflow-y: auto;
  text-align: left;
}

.modal-close-button,
.mobile-menu-close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.mobile-menu-close-button {
  top: 5px;
  right: 5px;
  padding: 0.5rem 1rem;
  font-size: 2rem;
  color: white;
}

/* User Menu */
.user-menu-container {
  position: relative;
}

.user-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.user-button:hover .user-avatar {
  transform: scale(1.05);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-header-footer);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  min-width: 250px;
  padding: 0.5rem;
  z-index: 1000;
}

.dropdown-header {
  padding: 0.75rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--text-tertiary);
}

.user-email {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

.dropdown-section {
  padding: 0.5rem 0;
}

.dropdown-section-title {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  color: var(--text-tertiary);
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s ease;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  font-size: 0.95rem;
}

.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}

.logout-item {
  color: var(--text-tertiary);
}

.logout-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-menu-container {
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 100%;
  padding: 3rem 2rem 2rem 2rem;
  gap: 2rem;
  text-align: left;
  box-sizing: border-box;
  z-index: 1002;
  background: var(--bg-header-footer);
}

.mobile-menu-container .mobile-menu-links a {
  margin-bottom: 0.5rem;
}

/* Slide Animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1);
}

.slide-enter-from {
  transform: translate(100%);
}
.slide-leave-to {
  transform: translate(100%);
}

.hide-element {
  pointer-events: none;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Footer */
.footer {
  margin-top: auto;
}

.footer-container {
  margin: 0 auto;
  padding: 1.5rem 2rem;
  text-align: center;
  background: var(--bg-header-footer);
}

.footer-text {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .nav-container {
    padding: 0 1rem;
  }

  .nav-center {
    display: none;
  }

  .mobile-menu-button {
    display: flex;
  }

  .site-name {
    font-size: 1.25rem;
  }

  .content-container {
    padding: 1rem;
  }

  .footer-container {
    padding: 1rem;
  }
}

@media (min-width: 769px) {
  .site-logo-icon {
    display: none;
  }
  .site-logo-text {
    display: block;
    width: 200px;
    height: 56px;
  }
}
</style>
