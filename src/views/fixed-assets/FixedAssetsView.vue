<template>
  <div class="space-y-4" @click="showProductDropdown = false">

    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Fixed Assets</h2>
      <button @click.stop="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add Asset</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3">
      <input v-model="search" @input="fetchAssets" type="text" placeholder="Search by name, tag, serial..."
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filterStatus" @change="fetchAssets" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Status</option>
        <option value="available">Available</option>
        <option value="assigned">Assigned</option>
        <option value="under_maintenance">Under Maintenance</option>
        <option value="damaged">Damaged</option>
        <option value="disposed">Disposed</option>
      </select>
      <select v-model="filterDept" @change="fetchAssets" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Departments</option>
        <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Asset Tag</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Asset Category</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Employee</th>
            <th class="px-4 py-3">Cost</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Condition</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="9" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="assets.length === 0"><td colspan="9" class="text-center py-8 text-gray-400">No assets found</td></tr>
          <tr v-for="asset in assets" :key="asset.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3"><span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">{{ asset.asset_tag }}</span></td>
            <td class="px-4 py-3">
              <p class="font-medium text-gray-700">{{ asset.name }}</p>
              <p class="text-xs text-gray-400">{{ asset.model }}</p>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ asset.asset_category?.name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ asset.department?.name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ asset.employee?.name || '—' }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">৳{{ formatNumber(asset.purchase_cost) }}</td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-green-100 text-green-700': asset.status === 'available',
                'bg-blue-100 text-blue-700': asset.status === 'assigned',
                'bg-yellow-100 text-yellow-700': asset.status === 'under_maintenance',
                'bg-red-100 text-red-700': asset.status === 'damaged' || asset.status === 'disposed',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ asset.status?.replace('_', ' ') }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-green-100 text-green-700': asset.condition === 'good',
                'bg-yellow-100 text-yellow-700': asset.condition === 'fair',
                'bg-orange-100 text-orange-700': asset.condition === 'poor',
                'bg-red-100 text-red-700': asset.condition === 'damaged',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ asset.condition }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-1 flex-wrap">
                <button @click="openModal(asset)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-2 py-1 rounded text-xs font-medium transition">✏️</button>
                <button v-if="asset.status === 'available'" @click="openAssignModal(asset)" class="bg-green-100 text-green-600 hover:bg-green-200 px-2 py-1 rounded text-xs font-medium transition">👤 Assign</button>
                <button v-if="asset.status === 'assigned'" @click="returnAsset(asset)" class="bg-yellow-100 text-yellow-600 hover:bg-yellow-200 px-2 py-1 rounded text-xs font-medium transition">↩️ Return</button>
                <button @click="viewHistory(asset)" class="bg-purple-100 text-purple-600 hover:bg-purple-200 px-2 py-1 rounded text-xs font-medium transition">📋 History</button>
                <button v-if="asset.status !== 'disposed'" @click="openDisposeModal(asset)" class="bg-orange-100 text-orange-500 hover:bg-orange-200 px-2 py-1 rounded text-xs font-medium transition">🗑️ Dispose</button>
                <button @click="deleteAsset(asset.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-2 py-1 rounded text-xs font-medium transition">❌</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} assets</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <AppModal :show="showModal" :title="editingAsset ? 'Edit Asset' : 'Add Fixed Asset'" max-width="max-w-2xl" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveAsset" class="space-y-3" @click.stop>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Asset Name *</label>
            <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Dell Laptop, Steel Chair" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Serial Number</label>
            <input v-model="form.serial_number" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Model</label>
            <input v-model="form.model" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Asset Category</label>
            <select v-model="form.asset_category_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Asset Category</option>
              <option v-for="ac in assetCategories" :key="ac.id" :value="ac.id">{{ ac.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Brand</label>
            <select v-model="form.brand_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Brand</option>
              <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Department</label>
            <select v-model="form.department_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Department</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Room</label>
            <select v-model="form.room_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Room</option>
              <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Purchase Date</label>
            <input v-model="form.purchase_date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Purchase Cost</label>
            <input v-model="form.purchase_cost" type="number" min="0" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Warranty Expiry</label>
            <input v-model="form.warranty_expiry" type="date" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Condition</label>
            <select v-model="form.condition" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="damaged">Damaged</option>
            </select>
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

    <!-- Assign Modal -->
    <AppModal :show="showAssignModal" title="Assign Asset" @close="showAssignModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedAsset?.name }} ({{ selectedAsset?.asset_tag }})</p>
      <form @submit.prevent="assignAsset" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Employee *</label>
          <select v-model="assignForm.employee_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">Select Employee</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }} ({{ e.employee_id }})</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Department</label>
          <select v-model="assignForm.department_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">Select Department</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Assigned Date *</label>
          <input v-model="assignForm.assigned_date" type="date" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Notes</label>
          <input v-model="assignForm.notes" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="showAssignModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Assigning...' : 'Assign' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Dispose Modal -->
    <AppModal :show="showDisposeModal" title="Dispose Asset" @close="showDisposeModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedAsset?.name }} ({{ selectedAsset?.asset_tag }})</p>
      <form @submit.prevent="submitDispose" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Disposal Date *</label>
          <input v-model="disposeForm.disposal_date" type="date" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Method *</label>
          <select v-model="disposeForm.method" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="written_off">Written Off</option>
            <option value="sold">Sold</option>
            <option value="donated">Donated</option>
            <option value="scrapped">Scrapped</option>
            <option value="damaged">Damaged/Lost</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Disposal Value</label>
          <input v-model="disposeForm.disposal_value" type="number" min="0" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Reason</label>
          <textarea v-model="disposeForm.reason" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="showDisposeModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition disabled:opacity-50">{{ saving ? 'Processing...' : 'Dispose Asset' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- History Modal -->
    <AppModal :show="showHistoryModal" title="Asset History" max-width="max-w-2xl" @close="showHistoryModal = false">
      <div v-if="historyData" class="space-y-4">
        <div class="bg-gray-50 rounded-xl p-4">
          <p class="font-semibold text-gray-700">{{ historyData.asset?.name }}</p>
          <p class="text-sm text-gray-500">Tag: {{ historyData.asset?.asset_tag }}</p>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-gray-600 mb-2">Assignments</h4>
          <div v-if="!historyData.assignments?.length" class="text-sm text-gray-400">No assignments</div>
          <div v-for="a in historyData.assignments" :key="a.id" class="flex justify-between items-center py-2 border-b text-sm">
            <div>
              <p class="font-medium text-gray-700">{{ a.employee?.name }}</p>
              <p class="text-xs text-gray-400">{{ a.assigned_date }} → {{ a.return_date || 'Current' }}</p>
            </div>
            <span :class="a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'" class="px-2 py-0.5 rounded-full text-xs">{{ a.status }}</span>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-gray-600 mb-2">Maintenance Records</h4>
          <div v-if="!historyData.maintenances?.length" class="text-sm text-gray-400">No maintenance records</div>
          <div v-for="m in historyData.maintenances" :key="m.id" class="py-2 border-b text-sm">
            <p class="font-medium text-gray-700 capitalize">{{ m.type }} — ৳{{ formatNumber(m.cost) }}</p>
            <p class="text-xs text-gray-400">{{ m.maintenance_date }} | {{ m.status }}</p>
          </div>
        </div>
        <div v-if="historyData.disposal">
          <h4 class="text-sm font-semibold text-gray-600 mb-2">Disposal Record</h4>
          <div class="bg-red-50 rounded-lg p-3 text-sm">
            <p class="font-medium text-red-700 capitalize">{{ historyData.disposal.method?.replace('_', ' ') }}</p>
            <p class="text-xs text-gray-500">Date: {{ historyData.disposal.disposal_date }}</p>
            <p class="text-xs text-gray-500">Value: ৳{{ formatNumber(historyData.disposal.disposal_value) }}</p>
            <p class="text-xs text-gray-500">Reason: {{ historyData.disposal.reason || '—' }}</p>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal :show="showConfirm" title="Delete Asset" max-width="max-w-sm" @close="showConfirm = false">
      <div class="text-center">
        <div class="text-5xl mb-4">❌</div>
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

const assets = ref([])
const assetCategories = ref([])
const brands = ref([])
const departments = ref([])
const rooms = ref([])
const employees = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showAssignModal = ref(false)
const showDisposeModal = ref(false)
const showHistoryModal = ref(false)
const showConfirm = ref(false)
const showProductDropdown = ref(false)
const editingAsset = ref(null)
const selectedAsset = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const historyData = ref(null)
const search = ref('')
const filterStatus = ref('')
const filterDept = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })

const form = ref({
  name: '', serial_number: '', model: '',
  asset_category_id: '', brand_id: '', department_id: '', room_id: '',
  purchase_date: '', purchase_cost: '', warranty_expiry: '',
  condition: 'good', description: '',
})

const assignForm = ref({ employee_id: '', department_id: '', assigned_date: '', notes: '' })
const disposeForm = ref({ disposal_date: new Date().toISOString().split('T')[0], method: 'written_off', disposal_value: 0, reason: '' })

function formatNumber(num) { return Number(num || 0).toLocaleString() }

async function fetchAssets(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/fixed-assets', { params: { page, per_page: 15, search: search.value, status: filterStatus.value, department_id: filterDept.value } })
    assets.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchMasterData() {
  const [ac, b, d, r, e] = await Promise.all([
    api.get('/asset-categories', { params: { per_page: 100 } }),
    api.get('/brands', { params: { per_page: 100 } }),
    api.get('/departments', { params: { per_page: 100 } }),
    api.get('/rooms', { params: { per_page: 100 } }),
    api.get('/employees', { params: { per_page: 100 } }),
  ])
  assetCategories.value = ac.data.data.data
  brands.value = b.data.data.data
  departments.value = d.data.data.data
  rooms.value = r.data.data.data
  employees.value = e.data.data.data
}

function openModal(asset = null) {
  editingAsset.value = asset
  formError.value = null
  form.value = asset ? {
    name: asset.name, serial_number: asset.serial_number || '',
    model: asset.model || '', asset_category_id: asset.asset_category_id || '',
    brand_id: asset.brand?.id || '', department_id: asset.department?.id || '',
    room_id: asset.room?.id || '',
    purchase_date: asset.purchase_date?.split('T')[0] || '',
    purchase_cost: asset.purchase_cost || '',
    warranty_expiry: asset.warranty_expiry?.split('T')[0] || '',
    condition: asset.condition || 'good', description: asset.description || '',
  } : {
    name: '', serial_number: '', model: '', asset_category_id: '',
    brand_id: '', department_id: '', room_id: '',
    purchase_date: '', purchase_cost: '', warranty_expiry: '',
    condition: 'good', description: '',
  }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingAsset.value = null }

async function saveAsset() {
  saving.value = true; formError.value = null
  try {
    if (editingAsset.value) { await api.put(`/fixed-assets/${editingAsset.value.id}`, form.value) }
    else { await api.post('/fixed-assets', form.value) }
    closeModal(); fetchAssets()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function openAssignModal(asset) {
  selectedAsset.value = asset
  assignForm.value = { employee_id: '', department_id: asset.department?.id || '', assigned_date: new Date().toISOString().split('T')[0], notes: '' }
  showAssignModal.value = true
}

async function assignAsset() {
  saving.value = true
  try {
    await api.post(`/fixed-assets/${selectedAsset.value.id}/assign`, assignForm.value)
    showAssignModal.value = false; fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
  finally { saving.value = false }
}

async function returnAsset(asset) {
  if (!confirm(`Return "${asset.name}"?`)) return
  await api.post(`/fixed-assets/${asset.id}/return`, { return_date: new Date().toISOString().split('T')[0] })
  fetchAssets()
}

function openDisposeModal(asset) {
  selectedAsset.value = asset
  disposeForm.value = { disposal_date: new Date().toISOString().split('T')[0], method: 'written_off', disposal_value: 0, reason: '' }
  showDisposeModal.value = true
}

async function submitDispose() {
  saving.value = true
  try {
    await api.post(`/fixed-assets/${selectedAsset.value.id}/dispose`, disposeForm.value)
    showDisposeModal.value = false; fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
  finally { saving.value = false }
}

async function viewHistory(asset) {
  const res = await api.get(`/fixed-assets/${asset.id}/history`)
  historyData.value = res.data.data
  showHistoryModal.value = true
}

function deleteAsset(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  await api.delete(`/fixed-assets/${confirmDeleteId.value}`)
  showConfirm.value = false; confirmDeleteId.value = null; fetchAssets()
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchAssets(page)
}

onMounted(() => { fetchAssets(); fetchMasterData() })
</script>