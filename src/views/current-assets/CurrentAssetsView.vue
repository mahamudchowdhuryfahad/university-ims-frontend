<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Current Assets (Consumables)</h2>
      <router-link to="/requisitions"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
        + New Requisition
      </router-link>
    </div>

    <!-- Filter -->
    <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3">
      <select v-model="filterDept" @change="fetchRequisitions()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Departments</option>
        <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
      <select v-model="filterStatus" @change="fetchRequisitions()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="fulfilled">Fulfilled</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-yellow-600">{{ counts.pending }}</p>
        <p class="text-xs text-gray-500 mt-1">Pending</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ counts.approved }}</p>
        <p class="text-xs text-gray-500 mt-1">Approved</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-green-600">{{ counts.fulfilled }}</p>
        <p class="text-xs text-gray-500 mt-1">Fulfilled</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-red-500">{{ counts.rejected }}</p>
        <p class="text-xs text-gray-500 mt-1">Rejected</p>
      </div>
    </div>

    <!-- Requisition Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b">
        <h3 class="font-semibold text-gray-700">📋 Consumable Requisitions</h3>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Reference</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Requested By</th>
            <th class="px-4 py-3">Items</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Date</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="requisitions.length === 0"><td colspan="7" class="text-center py-8 text-gray-400">No requisitions found</td></tr>
          <tr v-for="req in requisitions" :key="req.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 font-medium text-blue-600">{{ req.reference }}</td>
            <td class="px-4 py-2 text-gray-700">{{ req.department?.name }}</td>
            <td class="px-4 py-2">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {{ req.requested_by?.name?.charAt(0) }}
                </div>
                <span class="text-gray-700 text-xs">{{ req.requested_by?.name }}</span>
              </div>
            </td>
            <td class="px-4 py-2">
              <div v-for="item in req.items" :key="item.id" class="text-xs text-gray-600">
                📦 {{ item.product?.name }}
                <span class="text-gray-400">
                  (Req: {{ item.requested_quantity }}
                  <span v-if="item.fulfilled_quantity > 0"> / Given: {{ item.fulfilled_quantity }}</span>)
                </span>
              </div>
            </td>
            <td class="px-4 py-2">
              <span :class="{
                'bg-yellow-100 text-yellow-700': req.status === 'pending',
                'bg-blue-100 text-blue-700': req.status === 'approved',
                'bg-green-100 text-green-700': req.status === 'fulfilled',
                'bg-red-100 text-red-700': req.status === 'rejected',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ req.status }}</span>
            </td>
            <td class="px-4 py-2 text-gray-400 text-xs">{{ formatDate(req.request_date) }}</td>
            <td class="px-4 py-2">
              <div class="flex gap-1">
                <button @click="viewReq(req)" class="bg-purple-100 text-purple-600 hover:bg-purple-200 px-2 py-1 rounded text-xs font-medium transition">👁️</button>
                <button v-if="req.status === 'approved'" @click="fulfillReq(req)" class="bg-green-100 text-green-600 hover:bg-green-200 px-2 py-1 rounded text-xs font-medium transition">✅ Assign</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }}</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
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
            <div><span class="text-gray-500">Requested By:</span> <span class="font-medium">{{ selectedReq.requested_by?.name }}</span></div>
            <div><span class="text-gray-500">Request Date:</span> <span class="font-medium">{{ formatDate(selectedReq.request_date) }}</span></div>
            <div><span class="text-gray-500">Required Date:</span> <span class="font-medium">{{ formatDate(selectedReq.required_date) }}</span></div>
            <div class="col-span-2"><span class="text-gray-500">Purpose:</span> <span class="font-medium">{{ selectedReq.purpose || '—' }}</span></div>
          </div>
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
                <td class="px-3 py-2 font-semibold text-green-600">{{ item.fulfilled_quantity }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Fulfill Modal -->
    <div v-if="showFulfillModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="showFulfillModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-bold text-gray-700 mb-4">Assign / Fulfill Requisition</h3>
        <p class="text-sm text-gray-500 mb-4">{{ selectedReq?.reference }} — {{ selectedReq?.requested_by?.name }}</p>
        <div class="space-y-3">
          <div v-for="item in fulfillItems" :key="item.id" class="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-700">{{ item.product?.name }}</p>
              <p class="text-xs text-gray-400">Approved: {{ item.approved_quantity }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-500">Give Qty</label>
              <<input v-model="item.fulfilled_quantity" type="number" min="0" :max="item.approved_quantity"
  class="w-20 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 block mt-1" />
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="showFulfillModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
            <button @click="submitFulfill" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm transition">✅ Assign & Fulfill</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'

const requisitions = ref([])
const departments = ref([])
const loading = ref(false)
const filterDept = ref('')
const filterStatus = ref('')
const showViewModal = ref(false)
const showFulfillModal = ref(false)
const selectedReq = ref(null)
const fulfillItems = ref([])
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })

const counts = computed(() => ({
  pending: requisitions.value.filter(r => r.status === 'pending').length,
  approved: requisitions.value.filter(r => r.status === 'approved').length,
  fulfilled: requisitions.value.filter(r => r.status === 'fulfilled').length,
  rejected: requisitions.value.filter(r => r.status === 'rejected').length,
}))

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchRequisitions(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/requisitions', {
      params: { page, per_page: 15, type: 'consumable', department_id: filterDept.value, status: filterStatus.value }
    })
    requisitions.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchDepartments() {
  const res = await api.get('/departments', { params: { per_page: 100 } })
  departments.value = res.data.data.data
}

async function viewReq(req) {
  const res = await api.get(`/requisitions/${req.id}`)
  selectedReq.value = res.data.data
  showViewModal.value = true
}

function fulfillReq(req) {
  selectedReq.value = req
  fulfillItems.value = req.items?.map(item => ({
    ...item,
    fulfilled_quantity: item.approved_quantity, // default approved quantity
  })) || []
  showFulfillModal.value = true
}

async function submitFulfill() {
  await api.patch(`/requisitions/${selectedReq.value.id}/fulfill`, {
    items: fulfillItems.value.map(item => ({
      id: item.id,
      fulfilled_quantity: Number(item.fulfilled_quantity),
    })),
  })
  showFulfillModal.value = false
  fetchRequisitions()
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchRequisitions(page)
}

onMounted(() => { fetchRequisitions(); fetchDepartments() })
</script>