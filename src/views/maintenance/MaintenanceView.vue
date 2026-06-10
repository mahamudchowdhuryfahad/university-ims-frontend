<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Asset Maintenance</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ New Maintenance</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3">
      <select v-model="filterStatus" @change="fetchMaintenances()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>

    <!-- Counts from API -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-yellow-600">{{ counts.pending || 0 }}</p>
        <p class="text-xs text-gray-500 mt-1">Pending</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ counts.in_progress || 0 }}</p>
        <p class="text-xs text-gray-500 mt-1">In Progress</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-green-600">{{ counts.completed || 0 }}</p>
        <p class="text-xs text-gray-500 mt-1">Completed</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Asset</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Supplier</th>
            <th class="px-4 py-3">Date</th>
            <th class="px-4 py-3">Cost</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="maintenances.length === 0"><td colspan="7" class="text-center py-8 text-gray-400">No maintenance records found</td></tr>
          <tr v-for="m in maintenances" :key="m.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-700">{{ m.fixed_asset?.name }}</p>
              <p class="text-xs text-gray-400 font-mono">{{ m.fixed_asset?.asset_tag }}</p>
            </td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-blue-100 text-blue-700': m.type === 'repair',
                'bg-purple-100 text-purple-700': m.type === 'service',
                'bg-green-100 text-green-700': m.type === 'inspection',
                'bg-orange-100 text-orange-700': m.type === 'upgrade',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ m.type }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ m.supplier?.name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ formatDate(m.maintenance_date) }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">৳{{ formatNumber(m.cost) }}</td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-yellow-100 text-yellow-700': m.status === 'pending',
                'bg-blue-100 text-blue-700': m.status === 'in_progress',
                'bg-green-100 text-green-700': m.status === 'completed',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ m.status?.replace('_', ' ') }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-1">
                <button @click="openModal(m)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-2 py-1 rounded text-xs font-medium transition">✏️</button>
                <button v-if="m.status !== 'completed'" @click="openCompleteModal(m)" class="bg-green-100 text-green-600 hover:bg-green-200 px-2 py-1 rounded text-xs font-medium transition">✅ Complete</button>
                <button @click="openDeleteConfirm(m.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-2 py-1 rounded text-xs font-medium transition">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} records</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- New/Edit Modal -->
    <AppModal :show="showModal" :title="editingMaintenance ? 'Edit Maintenance' : 'New Maintenance Record'" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveMaintenance" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Fixed Asset *</label>
            <select v-model="form.fixed_asset_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Asset</option>
              <option v-for="a in assets" :key="a.id" :value="a.id">{{ a.name }} ({{ a.asset_tag }})</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Type *</label>
            <select v-model="form.type" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="repair">Repair</option>
              <option value="service">Service</option>
              <option value="inspection">Inspection</option>
              <option value="upgrade">Upgrade</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Status</label>
            <select v-model="form.status" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Maintenance Date *</label>
            <input v-model="form.maintenance_date" type="date" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Expected Completion</label>
            <input v-model="form.completion_date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Supplier</label>
            <select v-model="form.supplier_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Supplier</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Cost</label>
            <input v-model="form.cost" type="number" min="0" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Description</label>
            <textarea v-model="form.description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="closeModal" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Complete Modal -->
    <AppModal :show="showCompleteModal" title="Complete Maintenance" @close="showCompleteModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedMaintenance?.fixed_asset?.name }}</p>
      <form @submit.prevent="submitComplete" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Completion Date *</label>
          <input v-model="completeForm.completion_date" type="date" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Final Cost</label>
          <input v-model="completeForm.cost" type="number" min="0" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Asset Condition After Repair</label>
          <select v-model="completeForm.asset_condition" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Remarks</label>
          <textarea v-model="completeForm.remarks" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="showCompleteModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : '✅ Mark Complete' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal :show="showConfirm" title="Delete Record" max-width="max-w-sm" @close="showConfirm = false">
      <div class="text-center">
        <div class="text-5xl mb-4">🗑️</div>
        <p class="text-sm text-gray-500 mb-6">Are you sure? This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="showConfirm = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="confirmDelete" :disabled="saving" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition disabled:opacity-50">{{ saving ? 'Deleting...' : 'Yes, Delete' }}</button>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import AppModal from '../../components/ui/AppModal.vue'

const maintenances = ref([])
const assets = ref([])
const suppliers = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showCompleteModal = ref(false)
const showConfirm = ref(false)
const editingMaintenance = ref(null)
const selectedMaintenance = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const filterStatus = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const counts = ref({ pending: 0, in_progress: 0, completed: 0 })

const form = ref({
  fixed_asset_id: '', type: 'repair', status: 'pending',
  maintenance_date: new Date().toISOString().split('T')[0],
  completion_date: '', supplier_id: '', cost: '', description: '',
})

const completeForm = ref({
  completion_date: new Date().toISOString().split('T')[0],
  cost: '', asset_condition: 'good', remarks: '',
})

function formatNumber(num) { return Number(num || 0).toLocaleString() }
function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchMaintenances(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/maintenances', { params: { page, per_page: 15, status: filterStatus.value } })
    maintenances.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
    await fetchCounts()
  } finally { loading.value = false }
}

async function fetchCounts() {
  try {
    const [pending, inProgress, completed] = await Promise.all([
      api.get('/maintenances', { params: { per_page: 1, status: 'pending' } }),
      api.get('/maintenances', { params: { per_page: 1, status: 'in_progress' } }),
      api.get('/maintenances', { params: { per_page: 1, status: 'completed' } }),
    ])
    counts.value = {
      pending: pending.data.data.total,
      in_progress: inProgress.data.data.total,
      completed: completed.data.data.total,
    }
  } catch (err) {
    console.error('Failed to load counts', err)
  }
}

async function fetchMasterData() {
  try {
    const [a, s] = await Promise.all([
      api.get('/fixed-assets', { params: { per_page: 100 } }),
      api.get('/suppliers', { params: { per_page: 100 } }),
    ])
    assets.value = a.data.data.data
    suppliers.value = s.data.data.data
  } catch (err) {
    console.error('Failed to load master data', err)
  }
}

function openModal(maintenance = null) {
  editingMaintenance.value = maintenance
  formError.value = null
  form.value = maintenance ? {
    fixed_asset_id: maintenance.fixed_asset?.id || '',
    type: maintenance.type, status: maintenance.status,
    maintenance_date: maintenance.maintenance_date?.split('T')[0] || '',
    completion_date: maintenance.completion_date?.split('T')[0] || '',
    supplier_id: maintenance.supplier?.id || '',
    cost: maintenance.cost || '', description: maintenance.description || '',
  } : {
    fixed_asset_id: '', type: 'repair', status: 'pending',
    maintenance_date: new Date().toISOString().split('T')[0],
    completion_date: '', supplier_id: '', cost: '', description: '',
  }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingMaintenance.value = null }

async function saveMaintenance() {
  saving.value = true; formError.value = null
  try {
    if (editingMaintenance.value) { await api.put(`/maintenances/${editingMaintenance.value.id}`, form.value) }
    else { await api.post('/maintenances', form.value) }
    closeModal(); fetchMaintenances()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function openCompleteModal(maintenance) {
  selectedMaintenance.value = maintenance
  completeForm.value = {
    completion_date: new Date().toISOString().split('T')[0],
    cost: maintenance.cost || '', asset_condition: 'good', remarks: '',
  }
  showCompleteModal.value = true
}

async function submitComplete() {
  saving.value = true
  try {
    await api.patch(`/maintenances/${selectedMaintenance.value.id}/complete`, completeForm.value)
    showCompleteModal.value = false; fetchMaintenances()
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
  finally { saving.value = false }
}

function openDeleteConfirm(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  saving.value = true
  try {
    await api.delete(`/maintenances/${confirmDeleteId.value}`)
    showConfirm.value = false
    confirmDeleteId.value = null
    fetchMaintenances()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not delete record')
  } finally { saving.value = false }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchMaintenances(page)
}

onMounted(() => { fetchMaintenances(); fetchMasterData() })
</script>