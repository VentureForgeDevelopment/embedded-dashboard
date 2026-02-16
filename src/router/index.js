import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router"
import DashboardLayout from "../layouts/DashboardLayout.vue"
import OverviewView from "../views/OverviewView.vue"
import EmbeddedOverview from "../views/EmbeddedOverview.vue"
import WebsitesView from "../views/WebsitesView.vue"
import SubscriptionsView from "../views/SubscriptionsView.vue"
import SubscriptionDetail from "../singleViews/SubscriptionDetail.vue"
import ManageLicenseView from "../views/ManageLicenseView.vue"
import CheckoutView from "../views/CheckoutView.vue"
import AccountSetupView from "../views/AccountSetupView.vue"
import ProfileView from "../views/ProfileView.vue"
import ManageUsersView from "../views/ManageUsersView.vue"
import EditAccountView from "../views/EditAccountView.vue"
import { config } from "../config/environment"
import { useAuthStore } from "../stores/auth"
import { useLicenseStore } from "../stores/license"
import { getPlatform } from "../utils/platform-bridge"
import InsufficientAccessLevel from "../views/InsufficientAccessLevel.vue"
import SuccessConfirmation from "../views/SuccessConfirmation.vue"
import ReferralsView from "../views/ReferralsView.vue"
import AgencyView from "../views/AgencyView.vue"
import EmbeddedAuthView from "../views/EmbeddedAuthView.vue"

// Define routes that require more than read-only access
const adminRequiredRoutes = ["checkout", "manage-users", "edit-account"]

const routes = [
  {
    path: "/",
    component: DashboardLayout,
    children: [
      {
        path: "",
        name: "overview",
        component: OverviewView,
      },
      {
        path: "websites",
        name: "websites",
        component: WebsitesView,
      },
      {
        path: "subscriptions",
        name: "subscriptions",
        component: SubscriptionsView,
      },
      {
        path: "subscriptions/:id",
        name: "subscription-detail",
        component: SubscriptionDetail,
        props: true,
      },
      {
        path: "websites/:id",
        name: "manage-license",
        component: ManageLicenseView,
        props: true,
      },
      {
        path: "websites/:id/customize",
        name: "manage-license-customize",
        component: ManageLicenseView,
        props: true,
      },
      {
        path: "websites/:id/global-exclusions",
        name: "manage-license-global-exclusions",
        component: ManageLicenseView,
        props: true,
      },
      {
        path: "websites/:id/translations",
        name: "manage-license-translations",
        component: ManageLicenseView,
        props: true,
      },
      {
        path: "websites/:id/translations/per-page",
        name: "manage-license-translations-perpage",
        component: ManageLicenseView,
        props: true,
      },
      {
        path: "websites/:id/sitemap",
        name: "manage-license-sitemap",
        component: ManageLicenseView,
        props: true,
      },
      {
        path: "websites/:id/localization",
        name: "manage-license-localization",
        component: ManageLicenseView,
        props: true,
      },
      {
        path: "websites/:id/analytics",
        name: "manage-license-analytics",
        component: ManageLicenseView,
        props: true,
      },
      {
        path: "checkout/:type?/:id?",
        name: "checkout",
        component: CheckoutView,
        props: true,
      },
      {
        path: "profile",
        name: "profile",
        component: ProfileView,
      },
      {
        path: "manage-users",
        name: "manage-users",
        component: ManageUsersView,
      },
      {
        path: "edit-account",
        name: "edit-account",
        component: EditAccountView,
      },
      {
        path: "account-setup",
        name: "account-setup",
        component: AccountSetupView,
      },
      {
        path: "insufficient-access",
        name: "insufficient-access",
        component: InsufficientAccessLevel,
      },
      {
        path: "success-confirmation/:type?",
        name: "success-confirmation",
        component: SuccessConfirmation,
        props: true,
      },
      {
        path: "referrals",
        name: "referrals",
        component: ReferralsView,
      },
      {
        path: "referrals/payouts",
        name: "referrals-payouts",
        component: ReferralsView,
      },
      {
        path: "referrals/ads",
        name: "referrals-ads",
        component: ReferralsView,
      },
      {
        path: "referrals/how-it-works",
        name: "referrals-how-it-works",
        component: ReferralsView,
      },
      {
        path: "agency",
        name: "agency",
        component: AgencyView,
      },
      {
        path: "agency/profit-calculator",
        name: "agency-profit-calculator",
        component: AgencyView,
      },
      {
        path: "agency/revenue-kit",
        name: "agency-revenue-kit",
        component: AgencyView,
      },
      {
        path: "agency/progress-tracker",
        name: "agency-progress-tracker",
        component: AgencyView,
      },
      {
        path: "/login",
        name: "embedded-login",
        component: EmbeddedAuthView,
      },
      {
        path: "welcome",
        name: "embedded-overview",
        component: EmbeddedOverview,
      },
    ],
  },
]

/**
 * Creates a router instance.
 * @param {boolean} isEmbedded - If true, creates a router with hash history for embedding.
 * @returns {Router} A Vue Router instance.
 */
export const createRouterInstance = (embeddedObject = null) => {
  // Conditionally select the router history mode.
  // - For the standalone app, use createWebHistory to preserve clean URLs.
  // - For the embedded WordPress app, use createWebHashHistory to avoid URL conflicts.
  const history = embeddedObject
    ? createWebHashHistory()
    : createWebHistory("/")

  const router = createRouter({
    history,
    routes,
  })

  // Navigation guard to check authentication
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const licenseStore = useLicenseStore()
    const isEmbedded = !!embeddedObject

    // If in embedded mode and navigating to overview, redirect to the active license or websites list.
    // Shopify defaults to the customize tab; WordPress defaults to the overview tab.
    const defaultLicenseRoute = getPlatform() === "shopify" ? "manage-license-customize" : "manage-license"

    if (isEmbedded && to.name === "overview") {
      if (licenseStore.state.active_license) {
        console.log("Dashboard router guard - Redirecting embedded 'overview' to active license.");
        return next({
          name: defaultLicenseRoute,
          params: { id: licenseStore.state.active_license.id },
        })
      } else {
        // If there's no single active license, show the list of all associated websites.
        console.log(
          "Dashboard router guard - Redirecting embedded 'overview' to websites list."
        )
        return next({ name: "embedded-overview" })
      }
    }

    // If user is authenticated and tries to access the embedded login page, redirect to overview.
    if (authStore.isAuthenticated && to.name === "embedded-login") {

      // Ensure licenses are loaded to determine the active_license for embedded users
      if (isEmbedded && !licenseStore.state.licenses) {
        try {
          console.log("Dashboard router guard - Fetching licenses for embedded user.");
          await licenseStore.getLicenses();
        } catch (error) {
          console.error("Dashboard router guard - Failed to fetch licenses:", error);
          // If licenses fail to load, redirect to a default page like /websites
          return next({ name: "websites" });
        }
      }

      if (isEmbedded && licenseStore.state.active_license) {
        console.log("Dashboard router guard - Redirecting authenticated embedded user to active license.");
        return next({
          name: defaultLicenseRoute,
          params: { id: licenseStore.state.active_license.id },
        })
      } else {
        return next({ name: "websites" })
      }

    }

    // Check if user is authenticated
    // We only need to check the session if the user is not authenticated AND they are not already going to the login page.
    if (!authStore.isAuthenticated && to.name !== "embedded-login") {
      console.log(
        "Dashboard router guard - User not authenticated, checking session..."
      )
      try {
        // If the route requires auth and user is not authenticated, try to log them in.
        // This will try to log in with SSO token if available (in embedded mode)
        // or validate an existing session cookie.
        await authStore.checkSession(embeddedObject)

        // If session check was successful and it's an embedded context,
        // ensure licenses are loaded to determine active_license.
        if (authStore.isAuthenticated && isEmbedded && !licenseStore.state.licenses) {
          try {
            console.log("Dashboard router guard - Session check successful, fetching licenses for embedded user.");
            await licenseStore.getLicenses();
          } catch (error) {
            console.error("Dashboard router guard - Failed to fetch licenses after session check:", error);
          }
        }
      } catch (error) {
        console.error("Dashboard router guard - Session check failed:", error)
        // If checkSession fails, we know we need to log in. The logic below will handle it.
      }
    } else if (authStore.isAuthenticated) {
      console.log(
        "Dashboard router guard - User already authenticated, proceeding to dashboard"
      )
    }

    // After attempting to log in via session/SSO, check authentication status again.
    // If the user is still not authenticated and not already on the login page, redirect them.
    if (!authStore.isAuthenticated && to.name !== "embedded-login") {
      if (isEmbedded) {
        // For embedded context, redirect to the internal login component.
        console.log(
          "Dashboard router guard - Unauthenticated in embedded context. Redirecting to internal login."
        )
        return next({
          name: "embedded-login",
          query: { redirect: to.fullPath },
        })
      } else {
        // For standalone context, redirect to the external login page.
        console.log(
          "Dashboard router guard - Unauthenticated in standalone context. Redirecting to external login."
        )
        const loginUrl = new URL(config.loginUrl)
        loginUrl.searchParams.set("from", "dashboard")
        window.location.href = loginUrl.toString()
        return // Stop further execution after hard redirect
      }
    }

    // If we reach here, the user is either authenticated or is navigating to the login page.
    if (authStore.isAuthenticated) {
      // User is authenticated, check for role-based access.
      const requiresAdmin = adminRequiredRoutes.includes(to.name)
      const isReadOnly = authStore.currentAccountRole === "Read Only"

      if (requiresAdmin && isReadOnly) {
        // User is trying to access an admin route with a read-only role
        return next({ name: "insufficient-access" })
      }
    }

    // Allow navigation to proceed (e.g., to the login page for unauthenticated users, or any page for authenticated users)
    next()
  })

  return router
}
