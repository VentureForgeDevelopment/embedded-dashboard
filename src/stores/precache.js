import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { config } from "../config/environment"
import api from "../utils/api"
import { useAuthStore } from "./auth"

export const usePreCacheStore = defineStore("precache", () => {
  const authStore = useAuthStore()
  const appApiUrl = computed(() => config.appApiUrl)

  // State: keyed by licenseId
  const statuses = ref({})
  const pollingIntervals = ref({})
  const pollingStartTimes = ref({}) // track when polling began per license
  const dismissedToasts = ref(new Set())

  // Completion events: list of { licenseId, timestamp } for recently completed pre-caches
  const recentCompletions = ref([])

  /**
   * Get pre-cache status for a specific license.
   */
  function getStatus(licenseId) {
    return statuses.value[licenseId] || null
  }

  /**
   * Check if a license has an active pre-cache in progress.
   */
  function isActive(licenseId) {
    const s = statuses.value[licenseId]
    return s?.active === true
  }

  /**
   * Check if a license just completed pre-caching (for success UI).
   */
  function justCompleted(licenseId) {
    const s = statuses.value[licenseId]
    return s?.status === "completed" && s?.active === false && s?.justCompleted === true
  }

  /**
   * Get progress percentage for a license.
   */
  function getPercentage(licenseId) {
    const s = statuses.value[licenseId]
    if (!s || !s.active) return 0
    return s.percentage || 0
  }

  /**
   * Fetch crawl status for a single license from the API.
   */
  async function fetchStatus(licenseId) {
    try {
      const res = await api.get(`${appApiUrl.value}crawler/status/${licenseId}`, {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      })

      const crawl = res.data?.active_crawl

      if (!crawl) {
        // No active crawl
        const prev = statuses.value[licenseId]
        if (prev?.active || prev?.pipelineActive) {
          // Crawl fully gone — mark as done (skip completion events if already fired)
          const alreadyCompleted = prev?.status === "completed"
          statuses.value[licenseId] = {
            active: false,
            pipelineActive: false,
            status: "completed",
            justCompleted: !alreadyCompleted,
            pages_discovered: prev.pages_discovered,
            pages_crawled: prev.pages_crawled,
            pages_translated: prev.pages_translated,
            percentage: 100,
          }
          stopPolling(licenseId)

          if (!alreadyCompleted) {
            recentCompletions.value.push({
              licenseId: parseInt(licenseId),
              pages_translated: prev.pages_translated || 0,
              pages_discovered: prev.pages_discovered || 0,
              timestamp: Date.now(),
            })

            setTimeout(() => {
              const s = statuses.value[licenseId]
              if (s?.justCompleted) {
                statuses.value[licenseId] = { ...s, justCompleted: false }
              }
            }, 10000)

            setTimeout(() => {
              recentCompletions.value = recentCompletions.value.filter(
                (c) => c.licenseId !== parseInt(licenseId)
              )
            }, 8000)
          }
        } else {
          // No active crawl and wasn't previously active.
          // Keep polling for up to 90 seconds after startPolling was called
          // to give the crawl job time to start (it's dispatched async on license creation).
          const startedAt = pollingStartTimes.value[licenseId]
          const elapsed = startedAt ? Date.now() - startedAt : Infinity
          if (elapsed < 90000) {
            // Still within grace period — keep polling, don't stop
            return
          }
          statuses.value[licenseId] = { active: false }
          stopPolling(licenseId)
        }
        return
      }

      const discovered = crawl.progress?.pages_discovered || 0
      const crawled = crawl.progress?.pages_crawled || 0
      const withContent = crawl.progress?.pages_with_content || 0
      const translated = crawl.progress?.pages_translated || 0

      const crawlStatus = crawl.status || "unknown"
      const isCrawlRunning = crawlStatus === "running" || crawlStatus === "pending"

      // Translations are complete when all pages with content have been translated
      const translationsComplete = withContent > 0 && translated >= withContent

      // For progress bar/toast: translations finishing = done, regardless of crawl status
      // The sitemap overlay tracks the full pipeline separately
      let percentage = 0
      let displayTotal = 0

      if (translationsComplete) {
        displayTotal = withContent
        percentage = 100
      } else if (isCrawlRunning) {
        displayTotal = 0
        if (discovered > 0) {
          percentage = Math.round((translated / discovered) * 100)
        }
      } else {
        displayTotal = withContent > 0 ? withContent : discovered
        if (displayTotal > 0) {
          percentage = Math.round((translated / displayTotal) * 100)
        }
      }

      // "active" = translations still in progress (for progress bar + toast)
      // "pipelineActive" = full pipeline including sitemap gen (for sitemap overlay)
      const translationsActive = !translationsComplete
      const pipelineActive = isCrawlRunning || !translationsComplete

      const prev = statuses.value[licenseId]

      // If translations just completed, fire completion events
      if (translationsComplete && prev?.active) {
        statuses.value[licenseId] = {
          active: false,
          pipelineActive,
          status: "completed",
          justCompleted: true,
          pages_discovered: displayTotal,
          pages_crawled: crawled,
          pages_translated: translated,
          percentage: 100,
        }

        recentCompletions.value.push({
          licenseId: parseInt(licenseId),
          pages_translated: translated,
          pages_discovered: displayTotal,
          timestamp: Date.now(),
        })

        setTimeout(() => {
          const s = statuses.value[licenseId]
          if (s?.justCompleted) {
            statuses.value[licenseId] = { ...s, justCompleted: false }
          }
        }, 10000)

        setTimeout(() => {
          recentCompletions.value = recentCompletions.value.filter(
            (c) => c.licenseId !== parseInt(licenseId)
          )
        }, 8000)

        // Keep polling so sitemap overlay can track the rest of the pipeline
        if (!pipelineActive) {
          stopPolling(licenseId)
        }
        return
      }

      statuses.value[licenseId] = {
        active: translationsActive,
        pipelineActive,
        status: translationsComplete ? "completed" : crawlStatus,
        pages_discovered: displayTotal,
        pages_crawled: crawled,
        pages_translated: translated,
        percentage: translationsActive ? Math.min(percentage, 99) : percentage,
        started_at: crawl.started_at,
      }

      if (!pipelineActive) {
        stopPolling(licenseId)
      }
    } catch (err) {
      console.warn(`Failed to fetch pre-cache status for license ${licenseId}:`, err)
    }
  }

  /**
   * Start polling for a specific license. Polls every 8 seconds while active.
   */
  function startPolling(licenseId) {
    if (pollingIntervals.value[licenseId]) return

    pollingStartTimes.value[licenseId] = Date.now()
    fetchStatus(licenseId)

    pollingIntervals.value[licenseId] = setInterval(() => {
      fetchStatus(licenseId)
    }, 8000)
  }

  /**
   * Do a single check for a license. Only starts persistent polling if a crawl is active.
   * Use this for bulk-checking licenses on page load instead of startPolling.
   */
  async function checkOnce(licenseId) {
    // Skip if already polling or already checked with no activity
    if (pollingIntervals.value[licenseId]) return
    const existing = statuses.value[licenseId]
    if (existing && existing.active === false && !existing.justCompleted) return

    try {
      const res = await api.get(`${appApiUrl.value}crawler/status/${licenseId}`, {
        headers: {
          "X-Account-ID": authStore.currentAccountId.toString(),
        },
      })

      const crawl = res.data?.active_crawl

      if (crawl) {
        const status = crawl.status || "unknown"
        const isRunning = status === "running" || status === "pending"
        if (isRunning) {
          // Active crawl found — start persistent polling
          startPolling(licenseId)
          return
        }
      }

      // No active crawl — just record it, don't poll
      statuses.value[licenseId] = { active: false }
    } catch (err) {
      // Silently ignore — non-critical
    }
  }

  function stopPolling(licenseId) {
    if (pollingIntervals.value[licenseId]) {
      clearInterval(pollingIntervals.value[licenseId])
      delete pollingIntervals.value[licenseId]
    }
    delete pollingStartTimes.value[licenseId]
  }

  function stopAllPolling() {
    Object.keys(pollingIntervals.value).forEach(stopPolling)
  }

  /**
   * Check all given licenses once. Only starts persistent polling for those with active crawls.
   */
  function pollForLicenses(licenseIds) {
    licenseIds.forEach((id) => checkOnce(id))
  }

  function dismissToast(licenseId) {
    dismissedToasts.value.add(licenseId)
  }

  function isToastDismissed(licenseId) {
    return dismissedToasts.value.has(licenseId)
  }

  function dismissCompletion(licenseId) {
    recentCompletions.value = recentCompletions.value.filter(
      (c) => c.licenseId !== licenseId
    )
  }

  const activePreCaches = computed(() => {
    return Object.entries(statuses.value)
      .filter(([id, s]) => s.active && !dismissedToasts.value.has(parseInt(id)))
      .map(([id, s]) => ({ licenseId: parseInt(id), ...s }))
  })

  return {
    statuses,
    recentCompletions,
    getStatus,
    isActive,
    justCompleted,
    getPercentage,
    fetchStatus,
    checkOnce,
    startPolling,
    stopPolling,
    stopAllPolling,
    pollForLicenses,
    dismissToast,
    isToastDismissed,
    dismissCompletion,
    activePreCaches,
  }
})
