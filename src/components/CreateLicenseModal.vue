<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Create New License</h2>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="license-form">
        <div class="form-group">
          <label for="domain">Domain Name</label>
          <input
            id="domain"
            v-model="formData.domain"
            type="text"
            placeholder="example.com"
            required
            :disabled="loading"
            class="form-input"
          />
          <small class="form-hint">Enter the domain name where this license will be used</small>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close" :disabled="loading">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create License' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import axios from '../utils/axios'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'created'])

const authStore = useAuthStore()
const loading = ref(false)
const error = ref(null)
const formData = ref({
  domain: ''
})

const close = () => {
  if (!loading.value) {
    formData.value.domain = ''
    error.value = null
    emit('close')
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    // Create the license with required fields
    const response = await axios.post('/api/licenses', {
      domain_name: formData.value.domain,
      account_id: authStore.currentAccountId,
      status: 'active',
      type: 'manual',
      settings: {
        languages: ['en'], // Default languages
        position: {
          vertical: 'bottom',
          horizontal: 'right',
          verticalOffset: 20,
          horizontalOffset: 20
        }
      }
    }, {
      headers: {
        'X-Account-ID': authStore.currentAccountId?.toString()
      }
    })

    if (response.data.success) {
      emit('created', response.data.data)
      loading.value = false  // Set loading to false before closing
      close()
    } else {
      throw new Error(response.data.error || 'Failed to create license')
    }
  } catch (err) {
    console.error('Error creating license:', err)
    error.value = err.response?.data?.error || err.message || 'Failed to create license'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
}

.license-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-hint {
  display: block;
  margin-top: 6px;
  font-size: 0.875rem;
  color: #6b7280;
}

.error-message {
  background-color: #fee;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #93bbfc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #d1d5db;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>