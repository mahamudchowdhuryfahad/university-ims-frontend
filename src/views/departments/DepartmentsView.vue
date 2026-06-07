<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Departments</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add Department</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3">
      <input v-model="search" @input="fetchDepartments" type="text" placeholder="Search by name or code..."
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filterSchool" @change="fetchDepartments" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Schools</option>
        <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Code</th>
            <th class="px-4 py-3">School</th>
            <th class="px-4 py-3">Head</th>
            <th class="px-4 py-3">Employees</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="departments.length === 0"><td colspan="8" class="text-center py-8 text-gray-400">No departments found</td></tr>
          <tr v-for="dept in departments" :key="dept.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ dept.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">{{ dept.name }}</td>
            <td class="px-4 py-3"><span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{{ dept.code }}</span></td>
            <td class="px-4 py-3 text-gray-500">{{ dept.school?.name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ dept.head_name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ dept.employees_count || 0 }}</td>
            <td class="px-4 py-3">
              <span :class="dept.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ dept.is_active ? 'Active' : 'Inactive' }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openModal(dept)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">✏️ Edit</button>
                <button @click="deleteDept(dept.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} departments</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
          <h3 class="text-lg font-bold text-gray-700 mb-4">{{ editingDept ? 'Edit Department' : 'Add Department' }}</h3>
          <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
          <form @submit.prevent="saveDept" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="text-xs font-medium text-gray-600">Department Name *</label>
                <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600">Code *</label>
                <input v-model="form.code" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600">School</label>
                <select v-model="form.school_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
                  <option value="">Select School</option>
                  <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600">Head Name</label>
                <input v-model="form.head_name" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600">Phone</label>
                <input v-model="form.phone" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div class="col-span-2">
                <label class="text-xs font-medium text-gray-600">Email</label>
                <input v-model="form.email" type="email" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div class="col-span-2 flex items-center gap-2">
                <input v-model="form.is_active" type="checkbox" id="is_active" />
                <label for="is_active" class="text-sm text-gray-600">Active</label>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="closeModal" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" :disabled="saving" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition disabled:opacity-50">{{ saving ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
          <div class="text-5xl mb-4">🗑️</div>
          <h3 class="text-lg font-bold text-gray-700 mb-2">Delete Department</h3>
          <p class="text-sm text-gray-500 mb-6">Are you sure? This action cannot be undone.</p>
          <div class="flex gap-3">
            <button @click="showConfirm = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
            <button @click="confirmDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition">Yes, Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const departments = ref([])
const schools = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showConfirm = ref(false)
const editingDept = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const search = ref('')
const filterSchool = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })

const form = ref({ name: '', code: '', school_id: '', head_name: '', phone: '', email: '', is_active: true })

async function fetchDepartments(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/departments', { params: { page, per_page: 15, search: search.value, school_id: filterSchool.value } })
    departments.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchSchools() {
  const res = await api.get('/schools', { params: { per_page: 100 } })
  schools.value = res.data.data.data
}

function openModal(dept = null) {
  editingDept.value = dept
  formError.value = null
  form.value = dept ? { name: dept.name, code: dept.code, school_id: dept.school?.id || '', head_name: dept.head_name || '', phone: dept.phone || '', email: dept.email || '', is_active: dept.is_active }
    : { name: '', code: '', school_id: '', head_name: '', phone: '', email: '', is_active: true }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingDept.value = null }

async function saveDept() {
  saving.value = true; formError.value = null
  try {
    if (editingDept.value) { await api.put(`/departments/${editingDept.value.id}`, form.value) }
    else { await api.post('/departments', form.value) }
    closeModal(); fetchDepartments()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function deleteDept(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  await api.delete(`/departments/${confirmDeleteId.value}`)
  showConfirm.value = false; confirmDeleteId.value = null; fetchDepartments()
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchDepartments(page)
}

onMounted(() => { fetchDepartments(); fetchSchools() })
</script>