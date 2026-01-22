<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../utils/api.js'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const users = ref([])
const loading = ref(false)
const showAddUser = ref(false)
const showEditUser = ref(false)
const newUser = ref({ name: '', email: '', password: '', account_role: 'User' })
const editingUser = ref(null)
const error = ref('')

// Load users from API
const loadUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('users')
    if (response.data.success) {
      users.value = response.data.users
    } else {
      error.value = 'Failed to load users'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load users'
    console.error('Error loading users:', err)
  } finally {
    loading.value = false
  }
}

// Add new user
const addUser = async () => {
  if (!newUser.value.name || !newUser.value.email) {
    error.value = 'Please fill in name and email'
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    const response = await api.post('users', newUser.value)
    if (response.data.success) {
      users.value.push(response.data.user)
      newUser.value = { name: '', email: '', password: '', account_role: 'User' }
      showAddUser.value = false
    } else {
      error.value = response.data.error || 'Failed to create user'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create user'
    console.error('Error creating user:', err)
  } finally {
    loading.value = false
  }
}

// Edit user
const editUser = (user) => {
  editingUser.value = { 
    id: user.id,
    name: user.name, 
    email: user.email, 
    account_role: user.account_role 
  }
  showEditUser.value = true
}

// Update user
const updateUser = async () => {
  if (!editingUser.value.name || !editingUser.value.email) {
    error.value = 'Please fill in all fields'
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    const response = await api.put(`users/${editingUser.value.id}`, {
      name: editingUser.value.name,
      email: editingUser.value.email,
      account_role: editingUser.value.account_role
    })
    if (response.data.success) {
      const index = users.value.findIndex(u => u.id === editingUser.value.id)
      if (index !== -1) {
        users.value[index] = response.data.user
      }
      showEditUser.value = false
      editingUser.value = null
    } else {
      error.value = response.data.error || 'Failed to update user'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to update user'
    console.error('Error updating user:', err)
  } finally {
    loading.value = false
  }
}

// Remove user access
const deleteUser = async (userId) => {
  if (!confirm('Are you sure you want to remove this user\'s access to this account?')) {
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    const response = await api.delete(`users/${userId}`)
    if (response.data.success) {
      users.value = users.value.filter(u => u.id !== userId)
    } else {
      error.value = response.data.error || 'Failed to remove user access'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to remove user access'
    console.error('Error removing user access:', err)
  } finally {
    loading.value = false
  }
}

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

// Cancel modals
const cancelAdd = () => {
  showAddUser.value = false
  newUser.value = { name: '', email: '', password: '', account_role: 'User' }
  error.value = ''
}

const cancelEdit = () => {
  showEditUser.value = false
  editingUser.value = null
  error.value = ''
}

// Watch for account changes and reload users
watch(() => authStore.currentAccountId, (newAccountId, oldAccountId) => {
  if (newAccountId !== oldAccountId && newAccountId) {
    loadUsers()
  }
}, { immediate: false })

// Load users when component mounts
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="users-container padding max-1200">
    <div class="page-header">
      <h2 class="page-title">Manage Users</h2>
      <button @click="showAddUser = true" class="btn btn-primary" :disabled="loading">Add User</button>
    </div>
    
    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = ''" class="close-error">&times;</button>
    </div>

    <!-- Users Table -->
    <div class="users-table">
      <div class="table-header">
        <div class="table-cell">Name</div>
        <div class="table-cell">Email</div>
        <div class="table-cell">Role</div>
        <div class="table-cell">Status</div>
        <div class="table-cell">Last Login</div>
        <div class="table-cell">Actions</div>
      </div>
      
      <div v-if="loading" class="loading-row">
        <div class="loading-message">Loading users...</div>
      </div>
      
      <div v-else-if="users.length === 0" class="empty-row">
        <div class="empty-message">No users found</div>
      </div>
      
      <div v-else v-for="user in users" :key="user.id" class="table-row">
        <div class="table-cell" data-label="Name">
          <div class="user-info">
            <div class="user-avatar">{{ user.name.split(' ').map(n => n[0]).join('') }}</div>
            <span class="user-name">{{ user.name }}</span>
          </div>
        </div>
        <div class="table-cell" data-label="Email">{{ user.email }}</div>
        <div class="table-cell" data-label="Role">
          <span class="role-badge" :class="user.account_role?.toLowerCase().replace(' ', '-')">{{ user.account_role }}</span>
        </div>
        <div class="table-cell" data-label="Status">
          <span class="status-badge active">Active</span>
        </div>
        <div class="table-cell" data-label="Last Login">{{ formatDate(user.updated_at) }}</div>
        <div class="table-cell" data-label="Actions">
          <div class="action-buttons">
            <button class="btn-action" @click="editUser(user)" :disabled="loading">Edit</button>
            <button class="btn-action danger" @click="deleteUser(user.id)" :disabled="loading">Remove</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddUser" class="modal-overlay" @click="showAddUser = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add User to Account</h3>
          <button @click="showAddUser = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Error Message -->
          <div v-if="error && showAddUser" class="error-message">
            {{ error }}
            <button @click="error = ''" class="close-error">&times;</button>
          </div>
          
          <form @submit.prevent="addUser">
            <div class="form-group">
              <label>Name</label>
              <input v-model="newUser.name" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="newUser.email" type="email" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Password <span class="help-text">(required for new users only)</span></label>
              <input v-model="newUser.password" type="password" class="form-input" />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select v-model="newUser.account_role" class="form-input">
                <option value="Owner">Owner</option>
                <option value="User">User</option>
                <option value="Read Only">Read Only</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="cancelAdd" class="btn btn-secondary" :disabled="loading">Cancel</button>
          <button @click="addUser" class="btn btn-primary" :disabled="loading">{{ loading ? 'Adding...' : 'Add User' }}</button>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUser" class="modal-overlay" @click="cancelEdit">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Edit User</h3>
          <button @click="cancelEdit" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Error Message -->
          <div v-if="error && showEditUser" class="error-message">
            {{ error }}
            <button @click="error = ''" class="close-error">&times;</button>
          </div>
          
          <form @submit.prevent="updateUser">
            <div class="form-group">
              <label>Name</label>
              <input v-model="editingUser.name" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="editingUser.email" type="email" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select v-model="editingUser.account_role" class="form-input">
                <option value="Owner">Owner</option>
                <option value="User">User</option>
                <option value="Read Only">Read Only</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="cancelEdit" class="btn btn-secondary" :disabled="loading">Cancel</button>
          <button @click="updateUser" class="btn btn-primary" :disabled="loading">{{ loading ? 'Updating...' : 'Update User' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-container {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.users-table {
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr 1.5fr;
  background: var(--bg-hover);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr 1.5fr;
  border-top: 1px solid var(--border-color);
  transition: background 0.2s ease;
}

.table-row:hover {
  background: var(--bg-hover);
}

.table-cell {
  padding: 1rem;
  display: flex;
  align-items: center;
  color: var(--text-primary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-name {
  font-weight: 500;
}

.role-badge, .status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.role-badge.owner {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.role-badge.user {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.role-badge.read-only {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--bg-hover);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.btn-action:hover {
  transform: translateY(-1px);
}

.btn-action.danger {
  color: #dc3545;
}

.btn-action.danger:hover {
  background: rgba(220, 53, 69, 0.1);
}

/* Modal Styles */
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

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 0.75rem 1.5rem;
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

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-error {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-row,
.empty-row {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.loading-message,
.empty-message {
  font-size: 1.1rem;
}

.help-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: normal;
}

@media (max-width: 768px) {
  .table-header {
    display: none;
  }

  .table-row {
    display: block;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 1rem;
    padding: 0.5rem;
  }

  .table-row:hover {
    background: var(--bg-secondary);
  }

  .table-cell {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0.5rem;
    text-align: right;
    border-bottom: 1px solid var(--border-color);
  }

  .table-row .table-cell:last-child {
    border-bottom: none;
  }

  .table-cell::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-primary);
    text-align: left;
    padding-right: 1rem;
  }

  .user-info {
    justify-content: flex-end;
  }
}
</style>