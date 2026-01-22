<template>
  <div class="invoices-section">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading invoices...</p>
    </div>
    <div v-else>
      <SlideInNotification
        :show="showSuccessNotification"
        message="Payment method updated successfully"
        type="success"
      />
      <SlideInNotification
        :show="showFailNotification"
        :message="failedMsg"
        type="error"
      />
      <SlideInNotification
        :show="showGenericFailNotification"
        message="An error occurred"
        type="error"
      />
      <div class="section-container no-margin">
        <h3 class="section-title">
          <span v-if="subscriptions.length > 1"> Upcoming Invoices </span>
          <span v-else> Upcoming Invoice </span>
        </h3>

        <div
          v-if="upcoming_invoices && upcoming_invoices.length > 0"
          class="upcoming-invoices-list"
        >
          <div
            v-for="upcomingInvoice in upcoming_invoices"
            :key="upcomingInvoice.id"
            class="upcoming-invoice-card"
          >
            <div class="upcoming-invoice-top">
              <p
                class="domain"
                v-if="getSubscriptionForInvoice(upcomingInvoice)?.license"
              >
                {{
                  getSubscriptionForInvoice(upcomingInvoice).license.domain_name
                }}
              </p>
              <p v-if="upcomingInvoice.created" class="processing-date">
                Processing on {{ formatDate(upcomingInvoice.created) }}
              </p>
            </div>
            <ul
              v-if="
                upcomingInvoice.line_items &&
                upcomingInvoice.line_items.length > 0
              "
              class="invoice-line-items"
            >
              <li
                v-for="line_item in upcomingInvoice.line_items"
                :key="line_item.id"
                class="line-item"
              >
                <span class="item-description">
                  {{ line_item.description }}
                </span>
                <span class="item-amount">
                  ${{ parseFloat(line_item.amount).toFixed(2) }}
                </span>
              </li>
            </ul>
            <div class="total">
              <p>Total:</p>
              <p>${{ parseFloat(upcomingInvoice.amount_due).toFixed(2) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="section-container">
        <h3 class="section-title">Previous Invoices</h3>
        <div class="invoices-table">
          <div class="table-header">
            <div class="table-cell">Domain</div>
            <div class="table-cell">Date</div>
            <div class="table-cell">Amount</div>
            <div class="table-cell">Status</div>
            <div class="table-cell">Actions</div>
          </div>

          <div v-for="invoice in invoices" :key="invoice.id" class="table-row">
            <div class="table-cell">
              <span v-if="getSubscriptionForInvoice(invoice)?.license">
                {{ getSubscriptionForInvoice(invoice).license.domain_name }}
              </span>
            </div>
            <div class="table-cell">{{ formatDate(invoice.created) }}</div>
            <div class="table-cell">
              ${{ parseFloat(invoice.amount_due).toFixed(2) }}
            </div>
            <div class="table-cell">
              <span
                v-if="invoice.status === 'paid'"
                class="status-badge paid"
                >{{ invoice.status }}</span
              >
              <span v-else class="status-badge unpaid">{{
                invoice.status === "open" ? "Failed" : "Error"
              }}</span>
            </div>
            <div class="table-cell">
              <button
                v-if="invoice.status === 'paid'"
                :class="[
                  'btn-link',
                  {
                    'btn-disabled':
                      accountRole === 'Read Only' || accountRole === 'User',
                  },
                ]"
              >
                <a :href="invoice.invoice_pdf" class="download-link" download>
                  <Download
                    style="
                      display: inline-flex;
                      justify-content: center;
                      align-items: center;
                    "
                  />
                  Invoice (PDF)
                </a>
              </button>
              <button
                v-else
                :class="[
                  'btn-link',
                  {
                    'btn-disabled':
                      accountRole === 'Read Only' || accountRole === 'User',
                  },
                ]"
                @click="confirmRetryFailedInvoice(invoice)"
              >
                <span v-if="!retryingFailedInvoice"> Retry Payment </span>
                <span v-else style="display: flex; align-items: center">
                  <div
                    class="loading-spinner-inline"
                    style="width: 20px; height: 20px; margin-right: 10px"
                  ></div>
                  Retrying...
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, toRefs } from "vue"
import { useAuthStore } from "../../stores/auth"
import { useSubscriptionStore } from "../../stores/subscription"
import Swal from "sweetalert2"
import Download from "vue-material-design-icons/Download.vue"
import SlideInNotification from "../SlideInNotification.vue"

export default {
  name: "Invoices",
  props: {
    invoices: {
      type: Array,
      required: true,
    },
    upcoming_invoices: {
      type: Array,
      required: false,
    },
    subscriptions: {
      type: Array,
      default: () => [],
    },
    subscription: {
      type: Object,
      default: null,
    },
    payment_method: {
      type: Object,
      default: null,
    },
    account_id: {
      type: Number,
      default: null,
    },
  },
  components: {
    Download,
    SlideInNotification,
  },
  setup(props) {
    const authStore = useAuthStore()
    const subscriptionStore = useSubscriptionStore()
    const { subscriptions } = toRefs(props)

    const showSuccessNotification = ref(false)
    const showFailNotification = ref(false)
    const failedMsg = ref("")
    const showGenericFailNotification = ref(false)

    //computed
    const accountRole = computed(() => authStore.currentAccountRole)

    const loading = computed(() => subscriptionStore.state.loading.invoices)
    const retryingFailedInvoice = computed(
      () => subscriptionStore.state.loading.retry_failed_invoice
    )

    //methods
    function getSubscriptionForInvoice(invoice) {
      if (!invoice || !invoice.subscription_id || !subscriptions.value) {
        return null
      }
      return subscriptions.value.find(
        (sub) => sub.stripe_id === invoice.subscription_id
      )
    }

    function formatDate(dateString) {
      if (!dateString) return ""

      const date = new Date(dateString)

      // Check if date is valid
      if (isNaN(date.getTime())) return dateString

      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const year = date.getFullYear()

      return `${month}-${day}-${year}`
    }

    function confirmRetryFailedInvoice(invoice) {
      Swal.fire({
        title: "Are you sure you want to retry payment?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, retry it!",
      }).then((result) => {
        if (result && result.value) {
          subscriptionStore
            .retryFailedInvoice({
              invoice_id: invoice.id,
              payment_method: props.payment_method.stripe_method_id,
              account_id: parseInt(props.account_id),
            })
            .then((res) => {
              console.log("res", res)
              console.log("res.data", res.data)
              if (
                res &&
                (res.data.success || parseInt(res.data.success) === 1)
              ) {
                showSuccessNotification.value = true
                setTimeout(() => {
                  showSuccessNotification.value = false
                }, 3000)

                setTimeout(() => {
                  subscriptionStore.getSubscriptionInvoices({
                    subscription_id: invoice.subscription_id,
                  })
                  subscriptionStore.getSubscriptions({
                    account_id: parseInt(props.account_id),
                  })
                }, 3100)
              } else {
                failedMsg.value = "Payment Failed"
                showFailNotification.value = true
                setTimeout(() => {
                  showFailNotification.value = false
                }, 3000)
              }
            })
            .catch((err) => {
              console.log(err)
              if (err && err.response && err.response.status == 402) {
                failedMsg.value = err.response.data.decline_code
                showFailNotification.value = true
                setTimeout(() => {
                  showFailNotification.value = false
                }, 3000)
              } else {
                showGenericFailNotification.value = true
                setTimeout(() => {
                  showGenericFailNotification.value = false
                }, 3000)
              }
            })
        }
      })
    }

    return {
      accountRole,
      loading,
      retryingFailedInvoice,
      showSuccessNotification,
      showFailNotification,
      showGenericFailNotification,
      failedMsg,
      //methods
      formatDate,
      getSubscriptionForInvoice,
      confirmRetryFailedInvoice,
      //components
      Download,
      SlideInNotification,
    }
  },
}
</script>

<style scoped>
.upcoming-invoice-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.upcoming-invoice-card:last-child {
  margin-bottom: 0;
}

.upcoming-invoice-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 2rem;
}

.upcoming-invoice-top .domain {
  font-size: 1.2rem;
  font-weight: 600;
}

.processing-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  text-align: right;
}

.invoice-line-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.line-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  margin: 0 3rem;
}

.line-item:last-child {
  border-bottom: none;
}

.total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 0.5rem 3rem 1rem 3rem;
  padding-top: 1rem;
  border-top: 2px solid var(--border-color);
  font-size: 1.1rem;
  font-weight: 600;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .upcoming-invoice-top {
    flex-direction: column;
    align-items: flex-start;
    margin: 0;
  }

  .upcoming-invoice-top .domain {
    margin-bottom: 0.5rem;
  }

  .processing-date {
    text-align: left;
  }

  .line-item,
  .total {
    margin-left: 0;
    margin-right: 0;
  }

  .invoices-table {
    border: none;
  }

  .table-header {
    display: none;
  }

  .table-row {
    display: block;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    background-color: var(--bg-secondary);
  }

  .table-cell {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color-light);
  }

  .table-row .table-cell:last-child {
    border-bottom: none;
  }

  .table-cell::before {
    content: attr(data-label);
    font-weight: bold;
    margin-right: 1rem;
  }
}
</style>
