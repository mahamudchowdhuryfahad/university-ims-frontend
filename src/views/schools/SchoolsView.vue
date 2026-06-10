<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Schools / Faculties</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add School</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4">
      <input v-model="search" @input="fetchSchools" type="text" placeholder="Search by name or code..."
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Code</th>
            <th class="px-4 py-3">Dean</th>
            <th class="px-4 py-3">Departments</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="schools.length === 0"><td colspan="7" class="text-center py-8 text-gray-400">No schools found</td></tr>
          <tr v-for="school in schools" :key="school.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ school.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">{{ school.name }}</td>
            <td class="px-4 py-3">
              <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{{ school.code }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ school.dean_name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ school.departments_count || 0 }}</td>
            <td class="px-4 py-3">
              <span :class="school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ school.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openModal(school)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">✏️ Edit</button>
                <button @click="deleteSchool(school.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} schools</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1"
            class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page"
            class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <AppModal :show="showModal" :title="editingSchool ? 'Edit School' : 'Add School'" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveSchool" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">School Name *</label>
            <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Code *</label>
            <input v-model="form.code" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Dean Name</label>
            <input v-model="form.dean_name" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Phone</label>
            <input v-model="form.phone" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Email</label>
            <input v-model="form.email" type="email" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="col-span-2 flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="is_active" />
            <label for="is_active" class="text-sm text-gray-600">Active</label>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="closeModal"
            class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving"
            class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
            style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal :show="showConfirm" title="Delete School" max-width="max-w-sm" @close="showConfirm = false">
      <div class="text-center">
        <div class="text-5xl mb-4">🗑️</div>
        <p class="text-sm text-gray-500 mb-6">Are you sure? This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="showConfirm = false"
            class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="confirmDelete"
            class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition">Yes, Delete</button>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import AppModal from '../../components/ui/AppModal.vue'

const schools = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showConfirm = ref(false)
const editingSchool = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const search = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const form = ref({ name: '', code: '', dean_name: '', phone: '', email: '', is_active: true })

async function fetchSchools(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/schools', { params: { page, per_page: 15, search: search.value } })
    schools.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

function openModal(school = null) {
  editingSchool.value = school
  formError.value = null
  form.value = school
    ? { name: school.name, code: school.code, dean_name: school.dean_name || '', phone: school.phone || '', email: school.email || '', is_active: school.is_active }
    : { name: '', code: '', dean_name: '', phone: '', email: '', is_active: true }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingSchool.value = null }

async function saveSchool() {
  saving.value = true; formError.value = null
  try {
    if (editingSchool.value) { await api.put(`/schools/${editingSchool.value.id}`, form.value) }
    else { await api.post('/schools', form.value) }
    closeModal(); fetchSchools()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function deleteSchool(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  try {
    await api.delete(`/schools/${confirmDeleteId.value}`)
    showConfirm.value = false
    confirmDeleteId.value = null
    fetchSchools()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not delete school')
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchSchools(page)
}

onMounted(() => fetchSchools())
</script>