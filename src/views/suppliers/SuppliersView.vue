<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Suppliers</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add Supplier</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4">
      <input v-model="search" @input="fetchSuppliers" type="text" placeholder="Search by name or email..."
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Phone</th>
            <th class="px-4 py-3">City</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="suppliers.length === 0"><td colspan="7" class="text-center py-8 text-gray-400">No suppliers found</td></tr>
          <tr v-for="s in suppliers" :key="s.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ s.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">{{ s.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ s.email || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ s.phone || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ s.city || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ s.is_active ? 'Active' : 'Inactive' }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openModal(s)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">✏️ Edit</button>
                <button @click="deleteSupplier(s.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} suppliers</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <AppModal :show="showModal" :title="editingSupplier ? 'Edit Supplier' : 'Add Supplier'" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveSupplier" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Name *</label>
            <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Email</label>
            <input v-model="form.email" type="email" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Phone</label>
            <input v-model="form.phone" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">City</label>
            <input v-model="form.city" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Country</label>
            <input v-model="form.country" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Address</label>
            <input v-model="form.address" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="col-span-2 flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="is_active" />
            <label for="is_active" class="text-sm text-gray-600">Active</label>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="closeModal" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal :show="showConfirm" title="Delete Supplier" max-width="max-w-sm" @close="showConfirm = false">
      <div class="text-center">
        <div class="text-5xl mb-4">🗑️</div>
        <p class="text-sm text-gray-500 mb-6">Are you sure? This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="showConfirm = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="confirmDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition">Yes, Delete</button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import AppModal from '../../components/ui/AppModal.vue'

const suppliers = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showConfirm = ref(false)
const editingSupplier = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const search = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const form = ref({ name: '', email: '', phone: '', city: '', country: '', address: '', is_active: true })

async function fetchSuppliers(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/suppliers', { params: { page, per_page: 15, search: search.value } })
    suppliers.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

function openModal(s = null) {
  editingSupplier.value = s
  formError.value = null
  form.value = s ? { name: s.name, email: s.email || '', phone: s.phone || '', city: s.city || '', country: s.country || '', address: s.address || '', is_active: s.is_active }
    : { name: '', email: '', phone: '', city: '', country: '', address: '', is_active: true }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingSupplier.value = null }

async function saveSupplier() {
  saving.value = true; formError.value = null
  try {
    if (editingSupplier.value) { await api.put(`/suppliers/${editingSupplier.value.id}`, form.value) }
    else { await api.post('/suppliers', form.value) }
    closeModal(); fetchSuppliers()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function deleteSupplier(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  await api.delete(`/suppliers/${confirmDeleteId.value}`)
  showConfirm.value = false; confirmDeleteId.value = null; fetchSuppliers()
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchSuppliers(page)
}

onMounted(() => fetchSuppliers())
</script>