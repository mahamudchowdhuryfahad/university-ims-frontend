<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Asset Categories (Fixed Assets)</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add Category</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4">
      <input v-model="search" @input="fetchCategories" type="text" placeholder="Search asset categories..."
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Code</th>
            <th class="px-4 py-3">Assets</th>
            <th class="px-4 py-3">Description</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="categories.length === 0"><td colspan="7" class="text-center py-8 text-gray-400">No asset categories found</td></tr>
          <tr v-for="cat in categories" :key="cat.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ cat.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">{{ cat.name }}</td>
            <td class="px-4 py-3">
              <span v-if="cat.code" class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{{ cat.code }}</span>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ cat.fixed_assets_count || 0 }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ cat.description || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="cat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ cat.is_active ? 'Active' : 'Inactive' }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openModal(cat)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">✏️ Edit</button>
                <button @click="deleteCategory(cat.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} categories</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <AppModal :show="showModal" :title="editingCat ? 'Edit Asset Category' : 'Add Asset Category'" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveCategory" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Category Name *</label>
          <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Code</label>
          <input v-model="form.code" placeholder="e.g. IT-EQ, FURN" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal :show="showConfirm" title="Delete Asset Category" max-width="max-w-sm" @close="showConfirm = false">
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

const categories = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showConfirm = ref(false)
const editingCat = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const search = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const form = ref({ name: '', code: '', description: '', is_active: true })

async function fetchCategories(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/asset-categories', { params: { page, per_page: 15, search: search.value } })
    categories.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

function openModal(cat = null) {
  editingCat.value = cat
  formError.value = null
  form.value = cat ? { name: cat.name, code: cat.code || '', description: cat.description || '', is_active: cat.is_active }
    : { name: '', code: '', description: '', is_active: true }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingCat.value = null }

async function saveCategory() {
  saving.value = true; formError.value = null
  try {
    if (editingCat.value) { await api.put(`/asset-categories/${editingCat.value.id}`, form.value) }
    else { await api.post('/asset-categories', form.value) }
    closeModal(); fetchCategories()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function deleteCategory(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  try {
    await api.delete(`/asset-categories/${confirmDeleteId.value}`)
    showConfirm.value = false
    confirmDeleteId.value = null
    fetchCategories()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not delete category')
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchCategories(page)
}

onMounted(() => fetchCategories())
</script>