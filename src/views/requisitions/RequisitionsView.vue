<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Requisitions</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ New Requisition</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3">
      <select v-model="filterStatus" @change="fetchRequisitions" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="fulfilled">Fulfilled</option>
      </select>
      <select v-model="filterType" @change="fetchRequisitions" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Types</option>
        <option value="consumable">Consumable</option>
        <option value="fixed_asset">Fixed Asset</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Reference</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Requested By</th>
            <th class="px-4 py-3">Date</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="requisitions.length === 0"><td colspan="7" class="text-center py-8 text-gray-400">No requisitions found</td></tr>
          <tr v-for="req in requisitions" :key="req.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 font-medium text-blue-600">{{ req.reference }}</td>
            <td class="px-4 py-3 text-gray-700">{{ req.department?.name }}</td>
            <td class="px-4 py-3">
              <span :class="req.type === 'consumable' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ req.type?.replace('_', ' ') }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ req.requested_by?.name }}</td>
            <td class="px-4 py-3 text-gray-400 text-xs">{{ formatDate(req.request_date) }}</td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-yellow-100 text-yellow-700': req.status === 'pending',
                'bg-green-100 text-green-700': req.status === 'approved' || req.status === 'fulfilled',
                'bg-red-100 text-red-700': req.status === 'rejected',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ req.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="viewRequisition(req)" class="bg-purple-100 text-purple-600 hover:bg-purple-200 px-3 py-1 rounded-lg text-xs font-medium transition">👁️ View</button>
                <button v-if="req.status === 'pending'" @click="openApproveModal(req)" class="bg-green-100 text-green-600 hover:bg-green-200 px-3 py-1 rounded-lg text-xs font-medium transition">✅ Approve</button>
                <button v-if="req.status === 'pending'" @click="rejectRequisition(req)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">❌ Reject</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} requisitions</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- New Requisition Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="showModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-700 mb-4">New Requisition</h3>
        <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
        <form @submit.prevent="saveRequisition" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-gray-600">Department *</label>
              <select v-model="form.department_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
                <option value="">Select Department</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Type *</label>
              <select v-model="form.type" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
                <option value="consumable">Consumable</option>
                <option value="fixed_asset">Fixed Asset</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Request Date *</label>
              <input v-model="form.request_date" type="date" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Required Date</label>
              <input v-model="form.required_date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="col-span-2">
              <label class="text-xs font-medium text-gray-600">Purpose</label>
              <input v-model="form.purpose" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium text-gray-600">Items *</label>
              <button type="button" @click="addItem" class="text-blue-600 text-xs hover:underline">+ Add Item</button>
            </div>
            <div v-for="(item, index) in form.items" :key="index" class="grid grid-cols-7 gap-2 mb-2 items-center">
              <div class="col-span-4">
                <select v-model="item.product_id" required class="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none">
                  <option value="">Select Product</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </div>
              <div class="col-span-2">
                <input v-model="item.requested_quantity" type="number" min="1" placeholder="Qty" required class="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none" />
              </div>
              <div class="col-span-1 text-center">
                <button type="button" @click="removeItem(index)" class="text-red-500 hover:text-red-700 text-lg">×</button>
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <button type="button" @click="showModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" :disabled="saving" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition disabled:opacity-50">{{ saving ? 'Saving...' : 'Submit' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Modal -->
    <div v-if="showViewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="showViewModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-700">Requisition Details</h3>
          <button @click="showViewModal = false" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div v-if="selectedReq" class="space-y-4">
          <div class="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-500">Reference:</span> <span class="font-medium">{{ selectedReq.reference }}</span></div>
            <div><span class="text-gray-500">Status:</span> <span class="font-medium capitalize ml-1">{{ selectedReq.status }}</span></div>
            <div><span class="text-gray-500">Department:</span> <span class="font-medium">{{ selectedReq.department?.name }}</span></div>
            <div><span class="text-gray-500">Type:</span> <span class="font-medium capitalize">{{ selectedReq.type?.replace('_', ' ') }}</span></div>
            <div><span class="text-gray-500">Request Date:</span> <span class="font-medium">{{ formatDate(selectedReq.request_date) }}</span></div>
            <div><span class="text-gray-500">Required Date:</span> <span class="font-medium">{{ formatDate(selectedReq.required_date) }}</span></div>
            <div class="col-span-2"><span class="text-gray-500">Purpose:</span> <span class="font-medium">{{ selectedReq.purpose || '—' }}</span></div>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-600 mb-2">Items</h4>
            <table class="w-full text-sm border rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr class="text-left text-gray-500">
                  <th class="px-3 py-2">Product</th>
                  <th class="px-3 py-2">Requested</th>
                  <th class="px-3 py-2">Approved</th>
                  <th class="px-3 py-2">Fulfilled</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedReq.items" :key="item.id" class="border-t">
                  <td class="px-3 py-2">{{ item.product?.name }}</td>
                  <td class="px-3 py-2">{{ item.requested_quantity }}</td>
                  <td class="px-3 py-2">{{ item.approved_quantity }}</td>
                  <td class="px-3 py-2">{{ item.fulfilled_quantity }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Approve Modal -->
    <div v-if="showApproveModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="showApproveModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-bold text-gray-700 mb-4">Approve Requisition</h3>
        <div class="space-y-3">
          <div v-for="item in approveItems" :key="item.id" class="flex items-center gap-3">
            <span class="flex-1 text-sm text-gray-700">{{ item.product?.name }}</span>
            <span class="text-xs text-gray-400">Req: {{ item.requested_quantity }}</span>
            <input v-model="item.approved_quantity" type="number" min="0" :max="item.requested_quantity" class="w-20 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Remarks</label>
            <input v-model="approveRemarks" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="showApproveModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
            <button @click="approveRequisition" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm transition">Approve</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const requisitions = ref([])
const departments = ref([])
const products = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showViewModal = ref(false)
const showApproveModal = ref(false)
const selectedReq = ref(null)
const formError = ref(null)
const filterStatus = ref('')
const filterType = ref('')
const approveItems = ref([])
const approveRemarks = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })

const form = ref({
  department_id: '', type: 'consumable',
  request_date: new Date().toISOString().split('T')[0],
  required_date: '', purpose: '',
  items: [{ product_id: '', requested_quantity: 1 }],
})

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchRequisitions(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/requisitions', { params: { page, per_page: 15, status: filterStatus.value, type: filterType.value } })
    requisitions.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchMasterData() {
  const [d, p] = await Promise.all([
    api.get('/departments', { params: { per_page: 100 } }),
    api.get('/products', { params: { per_page: 100 } }),
  ])
  departments.value = d.data.data.data
  products.value = p.data.data.data
}

function openModal() {
  form.value = {
    department_id: '', type: 'consumable',
    request_date: new Date().toISOString().split('T')[0],
    required_date: '', purpose: '',
    items: [{ product_id: '', requested_quantity: 1 }],
  }
  formError.value = null
  showModal.value = true
}

function addItem() { form.value.items.push({ product_id: '', requested_quantity: 1 }) }
function removeItem(index) { if (form.value.items.length > 1) form.value.items.splice(index, 1) }

async function saveRequisition() {
  saving.value = true; formError.value = null
  try {
    await api.post('/requisitions', form.value)
    showModal.value = false; fetchRequisitions()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

async function viewRequisition(req) {
  const res = await api.get(`/requisitions/${req.id}`)
  selectedReq.value = res.data.data
  showViewModal.value = true
}

function openApproveModal(req) {
  selectedReq.value = req
  approveItems.value = req.items?.map(item => ({ ...item, approved_quantity: item.requested_quantity })) || []
  approveRemarks.value = ''
  showApproveModal.value = true
}

async function approveRequisition() {
  await api.patch(`/requisitions/${selectedReq.value.id}/approve`, {
    remarks: approveRemarks.value,
    items: approveItems.value.map(item => ({ id: item.id, approved_quantity: Number(item.approved_quantity) })),
  })
  showApproveModal.value = false; fetchRequisitions()
}

async function rejectRequisition(req) {
  const remarks = prompt('Rejection reason:')
  if (!remarks) return
  await api.patch(`/requisitions/${req.id}/reject`, { remarks })
  fetchRequisitions()
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchRequisitions(page)
}

onMounted(() => { fetchRequisitions(); fetchMasterData() })
</script>