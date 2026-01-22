<script setup>
import { ref } from 'vue'

const apiKeys = ref([
  { id: 1, name: 'Production API', key: 'wl_prod_1234...', created: '2024-01-15', lastUsed: '2 hours ago', active: true },
  { id: 2, name: 'Development API', key: 'wl_dev_5678...', created: '2024-02-01', lastUsed: '1 day ago', active: true },
  { id: 3, name: 'Testing API', key: 'wl_test_9012...', created: '2024-02-15', lastUsed: 'Never', active: false }
])

const webhooks = ref([
  { id: 1, name: 'Translation Complete', url: 'https://api.example.com/webhook', events: ['translation.completed'], active: true },
  { id: 2, name: 'Error Notifications', url: 'https://api.site.com/errors', events: ['translation.failed', 'api.error'], active: true }
])

const showNewApiKey = ref(false)
const showNewWebhook = ref(false)

const newApiKey = ref({ name: '' })
const newWebhook = ref({ name: '', url: '', events: [] })

const generateApiKey = () => {
  const key = 'wl_' + Math.random().toString(36).substr(2, 20)
  apiKeys.value.push({
    id: apiKeys.value.length + 1,
    name: newApiKey.value.name,
    key: key + '...',
    created: new Date().toISOString().split('T')[0],
    lastUsed: 'Never',
    active: true
  })
  newApiKey.value = { name: '' }
  showNewApiKey.value = false
}

const addWebhook = () => {
  webhooks.value.push({
    id: webhooks.value.length + 1,
    ...newWebhook.value,
    active: true
  })
  newWebhook.value = { name: '', url: '', events: [] }
  showNewWebhook.value = false
}
</script>

<template>
  <div class="settings-container">
    <h2 class="page-title">Settings</h2>

    <!-- API Keys Section -->
    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">API Keys</h3>
        <button @click="showNewApiKey = true" class="btn btn-primary">Generate Key</button>
      </div>
      
      <div class="api-keys-list">
        <div v-for="apiKey in apiKeys" :key="apiKey.id" class="api-key-card">
          <div class="api-key-info">
            <div class="api-key-name">{{ apiKey.name }}</div>
            <div class="api-key-details">
              <span class="api-key-value">{{ apiKey.key }}</span>
              <span class="api-key-meta">Created: {{ apiKey.created }} • Last used: {{ apiKey.lastUsed }}</span>
            </div>
          </div>
          <div class="api-key-actions">
            <span class="status-badge" :class="{ active: apiKey.active, inactive: !apiKey.active }">
              {{ apiKey.active ? 'Active' : 'Inactive' }}
            </span>
            <button class="btn-action">Copy</button>
            <button class="btn-action">Revoke</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Webhooks Section -->
    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">Webhooks</h3>
        <button @click="showNewWebhook = true" class="btn btn-primary">Add Webhook</button>
      </div>
      
      <div class="webhooks-list">
        <div v-for="webhook in webhooks" :key="webhook.id" class="webhook-card">
          <div class="webhook-info">
            <div class="webhook-name">{{ webhook.name }}</div>
            <div class="webhook-url">{{ webhook.url }}</div>
            <div class="webhook-events">
              <span v-for="event in webhook.events" :key="event" class="event-tag">{{ event }}</span>
            </div>
          </div>
          <div class="webhook-actions">
            <span class="status-badge" :class="{ active: webhook.active, inactive: !webhook.active }">
              {{ webhook.active ? 'Active' : 'Inactive' }}
            </span>
            <button class="btn-action">Edit</button>
            <button class="btn-action">Test</button>
            <button class="btn-action danger">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- General Settings -->
    <div class="settings-section">
      <h3 class="section-title">General Settings</h3>
      
      <div class="settings-form">
        <div class="form-group">
          <label class="form-label">Default Language</label>
          <select class="form-input">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Timezone</label>
          <select class="form-input">
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London Time</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" class="checkbox" />
            <span class="checkmark"></span>
            Email notifications for translation completion
          </label>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" class="checkbox" />
            <span class="checkmark"></span>
            Weekly usage reports
          </label>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary">Save Settings</button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- API Key Modal -->
    <div v-if="showNewApiKey" class="modal-overlay" @click="showNewApiKey = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Generate New API Key</h3>
          <button @click="showNewApiKey = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Key Name</label>
            <input v-model="newApiKey.name" type="text" class="form-input" placeholder="e.g., Production API" />
          </div>
          <p class="modal-note">This API key will have full access to your account. Keep it secure!</p>
        </div>
        <div class="modal-footer">
          <button @click="showNewApiKey = false" class="btn btn-secondary">Cancel</button>
          <button @click="generateApiKey" class="btn btn-primary">Generate Key</button>
        </div>
      </div>
    </div>

    <!-- Webhook Modal -->
    <div v-if="showNewWebhook" class="modal-overlay" @click="showNewWebhook = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add New Webhook</h3>
          <button @click="showNewWebhook = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Webhook Name</label>
            <input v-model="newWebhook.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>Endpoint URL</label>
            <input v-model="newWebhook.url" type="url" class="form-input" />
          </div>
          <div class="form-group">
            <label>Events</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" value="translation.completed" class="checkbox" />
                <span class="checkmark"></span>
                Translation Completed
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="translation.failed" class="checkbox" />
                <span class="checkmark"></span>
                Translation Failed
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="api.error" class="checkbox" />
                <span class="checkmark"></span>
                API Error
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showNewWebhook = false" class="btn btn-secondary">Cancel</button>
          <button @click="addWebhook" class="btn btn-primary">Add Webhook</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2rem 0;
}

.settings-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* API Keys */
.api-keys-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.api-key-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-hover);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.api-key-card:hover {
  background: var(--bg-primary);
}

.api-key-info {
  flex: 1;
}

.api-key-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.api-key-value {
  font-family: monospace;
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.api-key-meta {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-left: 1rem;
}

.api-key-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Webhooks */
.webhooks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.webhook-card {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 1.5rem;
  background: var(--bg-hover);
  border-radius: 8px;
}

.webhook-info {
  flex: 1;
}

.webhook-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.webhook-url {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  font-family: monospace;
}

.webhook-events {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.event-tag {
  background: var(--accent-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.webhook-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Status badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Form styles */
.settings-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
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
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: var(--text-primary);
}

.checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-color);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-start;
  margin-top: 1rem;
}

/* Buttons */
.btn, .btn-action {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
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

.btn-action {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-action.danger {
  color: #dc3545;
}

.btn:hover, .btn-action:hover {
  transform: translateY(-1px);
}

/* Modal styles (same as previous) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 500px;
  margin: 2rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-note {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 1rem 0 0 0;
  padding: 0.75rem;
  background: rgba(251, 146, 60, 0.1);
  border-radius: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}
</style>