<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Employees</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add Employee</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3">
      <input v-model="search" @input="fetchEmployees" type="text" placeholder="Search by name, ID or email..."
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filterDept" @change="fetchEmployees" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Departments</option>
        <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Employee ID</th>
            <th class="px-4 py-3">Designation</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Phone</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="employees.length === 0"><td colspan="8" class="text-center py-8 text-gray-400">No employees found</td></tr>
          <tr v-for="emp in employees" :key="emp.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ emp.id }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{{ emp.name?.charAt(0) }}</div>
                <span class="font-medium text-gray-700">{{ emp.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3"><span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">{{ emp.employee_id }}</span></td>
            <td class="px-4 py-3 text-gray-500">{{ emp.designation || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ emp.department?.name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ emp.phone || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-green-100 text-green-700': emp.status === 'active',
                'bg-yellow-100 text-yellow-700': emp.status === 'inactive',
                'bg-red-100 text-red-700': emp.status === 'resigned',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ emp.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openModal(emp)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">✏️ Edit</button>
                <button @click="deleteEmployee(emp.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} employees</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <AppModal :show="showModal" :title="editingEmp ? 'Edit Employee' : 'Add Employee'" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveEmployee" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Name *</label>
            <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Employee ID *</label>
            <input v-model="form.employee_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Designation</label>
            <input v-model="form.designation" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
            <label class="text-xs font-medium text-gray-600">Department</label>
            <select v-model="form.department_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Department</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Status</label>
            <select v-model="form.status" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="resigned">Resigned</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="closeModal" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal :show="showConfirm" title="Delete Employee" max-width="max-w-sm" @close="showConfirm = false">
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

const employees = ref([])
const departments = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showConfirm = ref(false)
const editingEmp = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const search = ref('')
const filterDept = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const form = ref({ name: '', employee_id: '', email: '', phone: '', designation: '', department_id: '', status: 'active' })

async function fetchEmployees(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/employees', { params: { page, per_page: 15, search: search.value, department_id: filterDept.value } })
    employees.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchDepartments() {
  try {
    const res = await api.get('/departments', { params: { per_page: 100 } })
    departments.value = res.data.data.data
  } catch (err) {
    console.error('Failed to load departments', err)
  }
}

function openModal(emp = null) {
  editingEmp.value = emp
  formError.value = null
  form.value = emp ? { name: emp.name, employee_id: emp.employee_id, email: emp.email || '', phone: emp.phone || '', designation: emp.designation || '', department_id: emp.department?.id || '', status: emp.status }
    : { name: '', employee_id: '', email: '', phone: '', designation: '', department_id: '', status: 'active' }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingEmp.value = null }

async function saveEmployee() {
  saving.value = true; formError.value = null
  try {
    if (editingEmp.value) { await api.put(`/employees/${editingEmp.value.id}`, form.value) }
    else { await api.post('/employees', form.value) }
    closeModal(); fetchEmployees()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function deleteEmployee(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  try {
    await api.delete(`/employees/${confirmDeleteId.value}`)
    showConfirm.value = false
    confirmDeleteId.value = null
    fetchEmployees()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not delete employee')
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchEmployees(page)
}

onMounted(() => { fetchEmployees(); fetchDepartments() })
</script>