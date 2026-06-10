<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Users</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add User</button>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-xl shadow-sm p-1 flex gap-1 w-fit">
      <button @click="activeTab = 'active'" :class="activeTab === 'active' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'" class="px-4 py-2 rounded-lg text-sm font-medium transition">Active Users</button>
      <button @click="activeTab = 'pending'; fetchPendingUsers()" :class="activeTab === 'pending' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100'" class="px-4 py-2 rounded-lg text-sm font-medium transition">
        Pending Approval
        <span v-if="pendingUsers.length > 0" class="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{{ pendingUsers.length }}</span>
      </button>
    </div>

    <!-- Active Users -->
    <div v-if="activeTab === 'active'">
      <div class="bg-white rounded-xl shadow-sm p-4">
        <input v-model="search" @input="fetchUsers" type="text" placeholder="Search by name or email..."
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden mt-4">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr class="text-left text-gray-500">
              <th class="px-4 py-3">#</th>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Role</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="text-center py-8 text-gray-400">Loading...</td></tr>
            <tr v-else-if="users.length === 0"><td colspan="6" class="text-center py-8 text-gray-400">No users found</td></tr>
            <tr v-for="(user, index) in users" :key="user.id" class="border-b hover:bg-gray-50 transition">
              <td class="px-4 py-3 text-gray-400">{{ (pagination.current_page - 1) * 15 + index + 1 }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{{ user.name?.charAt(0)?.toUpperCase() }}</div>
                  <span class="font-medium text-gray-700">{{ user.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium capitalize">{{ getRoleName(user.roles) }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ user.is_active ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button @click="openModal(user)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">✏️ Edit</button>
                  <button @click="toggleStatus(user)" :class="user.is_active ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'" class="px-3 py-1 rounded-lg text-xs font-medium transition">
                    {{ user.is_active ? '🔒 Deactivate' : '✅ Activate' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
          <span>Total: {{ pagination.total }} users</span>
          <div class="flex gap-2">
            <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
            <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
            <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Users -->
    <div v-if="activeTab === 'pending'" class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Requested Role</th>
            <th class="px-4 py-3">Registered</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pendingLoading"><td colspan="6" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="pendingUsers.length === 0"><td colspan="6" class="text-center py-8 text-gray-400">No pending users</td></tr>
          <tr v-for="(user, index) in pendingUsers" :key="user.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ index + 1 }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{{ user.name?.charAt(0)?.toUpperCase() }}</div>
                <span class="font-medium text-gray-700">{{ user.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ user.email }}</td>
            <td class="px-4 py-3">
              <span class="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium capitalize">{{ getRoleName(user.roles) || 'requester' }}</span>
            </td>
            <td class="px-4 py-3 text-gray-400 text-xs">{{ formatDate(user.created_at) }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openApproveModal(user)" class="bg-green-100 text-green-600 hover:bg-green-200 px-3 py-1 rounded-lg text-xs font-medium transition">✅ Approve</button>
                <button @click="openRejectConfirm(user)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">❌ Reject</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <AppModal :show="showModal" :title="editingUser ? 'Edit User' : 'Add User'" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveUser" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Name *</label>
          <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Email *</label>
          <input v-model="form.email" type="email" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Password {{ editingUser ? '(leave blank to keep)' : '*' }}</label>
          <input v-model="form.password" type="password" :required="!editingUser" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Role</label>
          <select v-model="form.role" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">Select Role</option>
            <option value="super-admin">Super Admin</option>
            <option value="fixed-asset-admin">Fixed Asset Admin</option>
            <option value="consumable-admin">Consumable Admin</option>
            <option value="store-admin">Store Admin</option>
            <option value="requester">Requester</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="form.is_active" type="checkbox" id="is_active" />
          <label for="is_active" class="text-sm text-gray-600">Active</label>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="closeModal" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Approve Modal -->
    <AppModal :show="showApproveModal" title="Approve User" @close="showApproveModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedUser?.name }} ({{ selectedUser?.email }})</p>
      <div class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Assign Role</label>
          <select v-model="approveRole" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="requester">Requester</option>
            <option value="store-admin">Store Admin</option>
            <option value="fixed-asset-admin">Fixed Asset Admin</option>
            <option value="consumable-admin">Consumable Admin</option>
            <option value="super-admin">Super Admin</option>
          </select>
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="showApproveModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="approveUser" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Approving...' : '✅ Approve & Activate' }}</button>
        </div>
      </div>
    </AppModal>

    <!-- Reject Confirm Modal -->
    <AppModal :show="showRejectConfirm" title="Reject User" max-width="max-w-sm" @close="showRejectConfirm = false">
      <div class="text-center">
        <div class="text-5xl mb-4">❌</div>
        <p class="text-sm font-medium text-gray-700 mb-1">Reject "{{ selectedUser?.name }}"?</p>
        <p class="text-xs text-gray-400 mb-6">This will permanently delete the user account.</p>
        <div class="flex gap-3">
          <button @click="showRejectConfirm = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="rejectUser" :disabled="saving" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">{{ saving ? 'Rejecting...' : 'Yes, Reject' }}</button>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import AppModal from '../../components/ui/AppModal.vue'

const users = ref([])
const pendingUsers = ref([])
const loading = ref(false)
const pendingLoading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showApproveModal = ref(false)
const showRejectConfirm = ref(false)
const editingUser = ref(null)
const selectedUser = ref(null)
const formError = ref(null)
const search = ref('')
const activeTab = ref('active')
const approveRole = ref('requester')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const form = ref({ name: '', email: '', password: '', role: '', is_active: true })

// Fix: roles can be plain string array or object array
function getRoleName(roles) {
  if (!roles || roles.length === 0) return '—'
  const first = roles[0]
  if (typeof first === 'string') return first
  if (typeof first === 'object') return first.name ?? '—'
  return '—'
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchUsers(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/users', { params: { page, per_page: 15, search: search.value, is_active: 1 } })
    users.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchPendingUsers() {
  pendingLoading.value = true
  try {
    const res = await api.get('/users', { params: { per_page: 100, is_active: 0 } })
    pendingUsers.value = res.data.data.data
  } finally { pendingLoading.value = false }
}

function openModal(user = null) {
  editingUser.value = user
  formError.value = null
  form.value = user
    ? { name: user.name, email: user.email, password: '', role: getRoleName(user.roles) === '—' ? '' : getRoleName(user.roles), is_active: user.is_active }
    : { name: '', email: '', password: '', role: '', is_active: true }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingUser.value = null }

async function saveUser() {
  saving.value = true; formError.value = null
  try {
    if (editingUser.value) { await api.put(`/users/${editingUser.value.id}`, form.value) }
    else { await api.post('/users', form.value) }
    closeModal(); fetchUsers()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

async function toggleStatus(user) {
  try {
    await api.patch(`/users/${user.id}/toggle-status`)
    fetchUsers()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not update status')
  }
}

function openApproveModal(user) {
  selectedUser.value = user
  approveRole.value = getRoleName(user.roles) !== '—' ? getRoleName(user.roles) : 'requester'
  showApproveModal.value = true
}

async function approveUser() {
  saving.value = true
  try {
    await api.patch(`/users/${selectedUser.value.id}/approve`, { role: approveRole.value })
    showApproveModal.value = false
    fetchPendingUsers()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not approve user')
  } finally { saving.value = false }
}

function openRejectConfirm(user) {
  selectedUser.value = user
  showRejectConfirm.value = true
}

async function rejectUser() {
  saving.value = true
  try {
    await api.delete(`/users/${selectedUser.value.id}`)
    showRejectConfirm.value = false
    fetchPendingUsers()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not reject user')
  } finally { saving.value = false }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchUsers(page)
}

onMounted(() => fetchUsers())
</script>