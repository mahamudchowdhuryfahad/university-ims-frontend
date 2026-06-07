<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Brands</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add Brand</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4">
      <input v-model="search" @input="fetchBrands" type="text" placeholder="Search brands..."
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Slug</th>
            <th class="px-4 py-3">Description</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="brands.length === 0"><td colspan="6" class="text-center py-8 text-gray-400">No brands found</td></tr>
          <tr v-for="brand in brands" :key="brand.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ brand.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">{{ brand.name }}</td>
            <td class="px-4 py-3 text-gray-400 text-xs">{{ brand.slug }}</td>
            <td class="px-4 py-3 text-gray-500">{{ brand.description || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="brand.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ brand.is_active ? 'Active' : 'Inactive' }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openModal(brand)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">✏️ Edit</button>
                <button @click="deleteBrand(brand.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} brands</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="closeModal"></div>
      <div class="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-700 mb-4">{{ editingBrand ? 'Edit Brand' : 'Add Brand' }}</h3>
        <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
        <form @submit.prevent="saveBrand" class="space-y-3">
          <div>
            <label class="text-xs font-medium text-gray-600">Brand Name *</label>
            <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Description</label>
            <textarea v-model="form.description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="is_active" />
            <label for="is_active" class="text-sm text-gray-600">Active</label>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeModal" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" :disabled="saving" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition disabled:opacity-50">{{ saving ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="showConfirm = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
        <div class="text-5xl mb-4">🗑️</div>
        <h3 class="text-lg font-bold text-gray-700 mb-2">Delete Brand</h3>
        <p class="text-sm text-gray-500 mb-6">Are you sure? This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="showConfirm = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="confirmDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition">Yes, Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const brands = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showConfirm = ref(false)
const editingBrand = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const search = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const form = ref({ name: '', description: '', is_active: true })

async function fetchBrands(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/brands', { params: { page, per_page: 15, search: search.value } })
    brands.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

function openModal(brand = null) {
  editingBrand.value = brand
  formError.value = null
  form.value = brand ? { name: brand.name, description: brand.description || '', is_active: brand.is_active }
    : { name: '', description: '', is_active: true }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingBrand.value = null }

async function saveBrand() {
  saving.value = true; formError.value = null
  try {
    if (editingBrand.value) { await api.put(`/brands/${editingBrand.value.id}`, form.value) }
    else { await api.post('/brands', form.value) }
    closeModal(); fetchBrands()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function deleteBrand(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  await api.delete(`/brands/${confirmDeleteId.value}`)
  showConfirm.value = false; confirmDeleteId.value = null; fetchBrands()
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchBrands(page)
}

onMounted(() => fetchBrands())
</script>