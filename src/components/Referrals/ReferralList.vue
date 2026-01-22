<template>
  <div class="referral-list-container">
    <h3 class="section-subtitle">Your Referrals</h3>
    <div v-if="referrals.length === 0" class="no-referrals">
      <p>You haven't referred anyone yet. Share your link to get started!</p>
    </div>
    <table v-else class="referrals-table">
      <thead>
        <tr>
          <th data-label="User">User</th>
          <th data-label="Plan">Plan</th>
          <th data-label="Status">Status</th>
          <th data-label="Earnings">Earnings</th>
        </tr>
      </thead>  
      <tbody>
        <tr v-for="referral in referrals" :key="referral.id">
          <td>
            <div class="user-info">
              <span class="user-name truncate-text">{{ referral.referee.name }}</span>
              <span class="user-email truncate-text">{{ referral.referee.email }}</span>
            </div>
          </td>
          <td>
            {{ referral.subscription_type == null ? 'N/A' : referral.subscription_type }}
          </td>
          <td>
            <span
              class="status-badge"
              :class="{
                'status-converted': referral.converted,
                'status-pending': !referral.converted,
              }"
            >
              {{ referral.converted ? "Converted" : "Pending" }}
            </span>
          </td>
          <td>
            {{ formatCurrency(referral.transactions_sum_commission_amount) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'ReferralList',
  props: {
    referrals: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const formatCurrency = (value) => {
      const amount = parseFloat(value) || 0;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    return {
      formatCurrency,
    }
  }
}
</script>

<style scoped>
.referral-list-container {
  margin: 2rem 1rem 1rem 1rem;
  text-align: left;
}

.no-referrals {
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.referrals-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  border:1px solid var(--border-color);
  border-radius: 4px;
}

.referrals-table th,
.referrals-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.referrals-table th {
  background-color: #f7f7f7;
  font-weight: 600;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
}

.user-email {
  font-size: 0.9em;
  color: #666;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
  color: white;
  text-transform: capitalize;
}

.status-converted {
  background-color: var(--success-green)
}

.status-pending {
  background-color: var(--warning-color);
  color: #212529;
}
@media (max-width: 500px) {
  .referrals-table thead {
    display: none;
  }

  .referrals-table, .referrals-table tbody, .referrals-table tr, .referrals-table td {
    display: block;
    width: 100%;
    border:none;
  }

  .referrals-table tr {
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
  }

  .referrals-table td {
    text-align: left;
    position: relative;
    border-bottom: 1px solid #e0e0e0;
  }

  .referrals-table tr td:last-child {
    border-bottom: 0;
  }

  .referrals-table td::before {
    content: attr(data-label);
    position: absolute;
    left: 15px;
    width: calc(50% - 30px);
    text-align: left;
    font-weight: 600;
    color: var(--text-primary);
  }

}
</style>
