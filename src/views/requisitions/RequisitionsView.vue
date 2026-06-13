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
                'bg-blue-100 text-blue-700': req.status === 'approved',
                'bg-green-100 text-green-700': req.status === 'fulfilled',
                'bg-red-100 text-red-700': req.status === 'rejected',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ req.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="viewRequisition(req)" class="bg-purple-100 text-purple-600 hover:bg-purple-200 px-3 py-1 rounded-lg text-xs font-medium transition">View</button>
                <button v-if="req.status === 'pending' && canApproveReq(req)" @click="openApproveModal(req)" class="bg-green-100 text-green-600 hover:bg-green-200 px-3 py-1 rounded-lg text-xs font-medium transition">Approve</button>
                <button v-if="req.status === 'pending' && canApproveReq(req)" @click="openRejectModal(req)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">Reject</button>
                <button v-if="req.status === 'approved' && canFulfill(req)" @click="openFulfillModal(req)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">Fulfill</button>
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
    <AppModal :show="showModal" title="New Requisition" max-width="max-w-2xl" @close="showModal = false">
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
            <select v-model="form.type" required @change="onTypeChange" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
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
            <label class="text-xs font-medium text-gray-600">Purpose / Notes</label>
            <textarea v-model="form.purpose" rows="2" placeholder="Describe what you need and why..." class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>

        <!-- Consumable Items -->
        <div v-if="form.type === 'consumable'">
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
              <button type="button" @click="removeItem(index)" class="text-red-500 hover:text-red-700 text-lg">x</button>
            </div>
          </div>
        </div>

        <!-- Fixed Asset Items -->
        <div v-else-if="form.type === 'fixed_asset'">
          <div class="flex justify-between items-center mb-2">
            <label class="text-sm font-medium text-gray-600">Items *</label>
            <button type="button" @click="addItem" class="text-blue-600 text-xs hover:underline">+ Add Item</button>
          </div>
          <div v-for="(item, index) in form.items" :key="index" class="grid grid-cols-7 gap-2 mb-2 items-center">
            <div class="col-span-4">
              <input v-model="item.item_description" required placeholder="e.g. HP LaserJet Printer, Office Chair..." class="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none" />
            </div>
            <div class="col-span-2">
              <input v-model="item.requested_quantity" type="number" min="1" placeholder="Qty" required class="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none" />
            </div>
            <div class="col-span-1 text-center">
              <button type="button" @click="removeItem(index)" class="text-red-500 hover:text-red-700 text-lg">x</button>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button type="button" @click="showModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : 'Submit' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- View Modal -->
    <AppModal :show="showViewModal" title="Requisition Details" max-width="max-w-2xl" @close="showViewModal = false">
      <div v-if="selectedReq" class="space-y-4">
        <div class="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500">Reference:</span> <span class="font-medium">{{ selectedReq.reference }}</span></div>
          <div><span class="text-gray-500">Status:</span> <span class="font-medium capitalize ml-1">{{ selectedReq.status }}</span></div>
          <div><span class="text-gray-500">Department:</span> <span class="font-medium">{{ selectedReq.department?.name }}</span></div>
          <div><span class="text-gray-500">Type:</span> <span class="font-medium capitalize">{{ selectedReq.type?.replace('_', ' ') }}</span></div>
          <div><span class="text-gray-500">Request Date:</span> <span class="font-medium">{{ formatDate(selectedReq.request_date) }}</span></div>
          <div><span class="text-gray-500">Required Date:</span> <span class="font-medium">{{ formatDate(selectedReq.required_date) }}</span></div>
          <div class="col-span-2"><span class="text-gray-500">Purpose:</span> <span class="font-medium">{{ selectedReq.purpose || '-' }}</span></div>
          <div v-if="selectedReq.remarks" class="col-span-2">
            <span class="text-gray-500">Remarks:</span>
            <span class="font-medium text-red-600 ml-1">{{ selectedReq.remarks }}</span>
          </div>
        </div>
        <table class="w-full text-sm border rounded-lg overflow-hidden">
          <thead class="bg-gray-50">
            <tr class="text-left text-gray-500">
              <th class="px-3 py-2">Item</th>
              <th class="px-3 py-2">Requested</th>
              <th class="px-3 py-2">Approved</th>
              <th class="px-3 py-2">Fulfilled</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in selectedReq.items" :key="item.id" class="border-t">
              <td class="px-3 py-2">{{ item.product?.name || item.item_description || '-' }}</td>
              <td class="px-3 py-2">{{ item.requested_quantity }}</td>
              <td class="px-3 py-2">{{ item.approved_quantity ?? '-' }}</td>
              <td class="px-3 py-2 font-semibold text-green-600">{{ item.fulfilled_quantity ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppModal>

    <!-- Approve Modal -->
    <AppModal :show="showApproveModal" title="Approve Requisition" @close="showApproveModal = false">
      <div class="space-y-3">
        <div v-for="item in approveItems" :key="item.id" class="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
          <span class="flex-1 text-sm text-gray-700">{{ item.product?.name || item.item_description || '-' }}</span>
          <span class="text-xs text-gray-400">Req: {{ item.requested_quantity }}</span>
          <input v-model="item.approved_quantity" type="number" min="0" :max="item.requested_quantity" class="w-20 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Remarks</label>
          <input v-model="approveRemarks" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="showApproveModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="approveRequisition" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Approving...' : 'Approve' }}</button>
        </div>
      </div>
    </AppModal>

    <!-- Fulfill Modal -->
    <AppModal :show="showFulfillModal" title="Fulfill Requisition" @close="showFulfillModal = false">
      <div class="space-y-3">
        <!-- Fixed Asset fulfill -->
        <div v-if="selectedReq?.type === 'fixed_asset'" class="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          Fixed asset requisition fulfill করলে status Fulfilled হবে। Actual asset assignment Fixed Assets page থেকে করতে হবে।
        </div>
        <!-- Consumable fulfill -->
        <template v-else>
          <div v-for="item in fulfillItems" :key="item.id" class="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
            <span class="flex-1 text-sm text-gray-700">{{ item.product?.name }}</span>
            <span class="text-xs text-gray-400">Approved: {{ item.approved_quantity }}</span>
            <input v-model="item.fulfilled_quantity" type="number" min="0" :max="item.approved_quantity" class="w-20 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </template>
        <div class="flex gap-3 pt-2">
          <button @click="showFulfillModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="fulfillRequisition" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Processing...' : 'Fulfill' }}</button>
        </div>
      </div>
    </AppModal>

    <!-- Reject Modal -->
    <AppModal :show="showRejectModal" title="Reject Requisition" max-width="max-w-sm" @close="showRejectModal = false">
      <div class="space-y-3">
        <p class="text-sm text-gray-500">{{ selectedReq?.reference }}</p>
        <div>
          <label class="text-xs font-medium text-gray-600">Rejection Reason *</label>
          <textarea v-model="rejectRemarks" rows="3" required placeholder="State the reason for rejection..."
            class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="showRejectModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="rejectRequisition" :disabled="saving" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">{{ saving ? 'Rejecting...' : 'Reject' }}</button>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import AppModal from '../../components/ui/AppModal.vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

const userRole = computed(() => {
  const roles = auth.user?.roles
  if (!roles) return ''
  const first = Array.isArray(roles) ? roles[0] : Object.values(roles)[0]
  return typeof first === 'string' ? first : first?.name ?? ''
})
// For simplicity, we assume each user has one role. Adjust logic if multiple roles are possible.
function canApproveReq(req) {
  if (userRole.value === 'super-admin') return true
  if (userRole.value === 'fixed-asset-admin') return req.type === 'fixed_asset'
  if (userRole.value === 'consumable-admin') return req.type === 'consumable'
  if (userRole.value === 'store-admin') return true
  return false
}

function canFulfill(req) {
  if (req.type === 'fixed_asset') return ['super-admin', 'fixed-asset-admin', 'store-admin'].includes(userRole.value)
  return ['super-admin', 'consumable-admin', 'store-admin'].includes(userRole.value)
}

const requisitions = ref([])
const departments = ref([])
const products = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showViewModal = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showFulfillModal = ref(false)
const selectedReq = ref(null)
const formError = ref(null)
const filterStatus = ref('')
const filterType = ref('')
const approveItems = ref([])
const fulfillItems = ref([])
const approveRemarks = ref('')
const rejectRemarks = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })

const form = ref({
  department_id: '', type: 'consumable',
  request_date: new Date().toISOString().split('T')[0],
  required_date: '', purpose: '',
  items: [{ product_id: '', requested_quantity: 1 }],
})

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function onTypeChange() {
  if (form.value.type === 'consumable') {
    form.value.items = [{ product_id: '', requested_quantity: 1 }]
  } else {
    form.value.items = [{ item_description: '', requested_quantity: 1 }]
  }
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
  const load = async (url, target) => {
    try {
      const res = await api.get(url, { params: { per_page: 100 } })
      target.value = res.data.data.data
    } catch {
      target.value = []
    }
  }
  await Promise.all([
    load('/departments', departments),
    load('/products', products),
  ])
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

function addItem() {
  if (form.value.type === 'consumable') {
    form.value.items.push({ product_id: '', requested_quantity: 1 })
  } else {
    form.value.items.push({ item_description: '', requested_quantity: 1 })
  }
}
function removeItem(index) { if (form.value.items.length > 1) form.value.items.splice(index, 1) }

async function saveRequisition() {
  saving.value = true; formError.value = null
  try {
    const payload = { ...form.value }
    if (form.value.type === 'fixed_asset') {
      payload.items = form.value.items.filter(i => i.item_description?.trim())
    }
    await api.post('/requisitions', payload)
    showModal.value = false; fetchRequisitions()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

async function viewRequisition(req) {
  try {
    const res = await api.get(`/requisitions/${req.id}`)
    selectedReq.value = res.data.data
    showViewModal.value = true
  } catch (err) {
    alert(err.response?.data?.message || 'Could not load requisition details')
  }
}

function openApproveModal(req) {
  selectedReq.value = req
  approveItems.value = req.items?.map(item => ({ ...item, approved_quantity: item.requested_quantity })) || []
  approveRemarks.value = ''
  showApproveModal.value = true
}

async function approveRequisition() {
  saving.value = true
  try {
    await api.patch(`/requisitions/${selectedReq.value.id}/approve`, {
      remarks: approveRemarks.value,
      items: approveItems.value.map(item => ({ id: item.id, approved_quantity: Number(item.approved_quantity) })),
    })
    showApproveModal.value = false
    fetchRequisitions()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not approve requisition')
  } finally { saving.value = false }
}

function openFulfillModal(req) {
  selectedReq.value = req
  fulfillItems.value = req.items?.map(item => ({ ...item, fulfilled_quantity: item.approved_quantity })) || []
  showFulfillModal.value = true
}

async function fulfillRequisition() {
  saving.value = true
  try {
    if (selectedReq.value.type === 'fixed_asset') {
      await api.patch(`/requisitions/${selectedReq.value.id}/fulfill`, { items: [] })
    } else {
      await api.patch(`/requisitions/${selectedReq.value.id}/fulfill`, {
        items: fulfillItems.value.map(item => ({ id: item.id, fulfilled_quantity: Number(item.fulfilled_quantity) })),
      })
    }
    showFulfillModal.value = false
    fetchRequisitions()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not fulfill requisition')
  } finally { saving.value = false }
}

function openRejectModal(req) {
  selectedReq.value = req
  rejectRemarks.value = ''
  showRejectModal.value = true
}

async function rejectRequisition() {
  if (!rejectRemarks.value.trim()) {
    alert('Please provide a rejection reason')
    return
  }
  saving.value = true
  try {
    await api.patch(`/requisitions/${selectedReq.value.id}/reject`, { remarks: rejectRemarks.value })
    showRejectModal.value = false
    fetchRequisitions()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not reject requisition')
  } finally { saving.value = false }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchRequisitions(page)
}

onMounted(() => { fetchRequisitions(); fetchMasterData() })
</script>