<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold text-gray-700">Reports</h2>

    <!-- Date Filter -->
    <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3 items-end">
      <div>
        <label class="text-xs font-medium text-gray-600">From</label>
        <input v-model="from" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="text-xs font-medium text-gray-600">To</label>
        <input v-model="to" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button @click="fetchAll" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">Filter</button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Total Fixed Assets</p>
        <p class="text-2xl font-bold text-blue-600">{{ summary.total_assets || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Assigned Assets</p>
        <p class="text-2xl font-bold text-green-600">{{ summary.assigned_assets || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Disposed Assets</p>
        <p class="text-2xl font-bold text-red-500">{{ summary.disposed_assets || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Pending Requisitions</p>
        <p class="text-2xl font-bold text-yellow-600">{{ summary.pending_requisitions || 0 }}</p>
      </div>
    </div>

    <!-- Fixed Asset Report -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b flex justify-between items-center">
        <h3 class="font-semibold text-gray-700">Fixed Assets Report</h3>
        <span class="text-xs text-gray-400">{{ assets.length }} records</span>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Asset Tag</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Cost</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Condition</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="assets.length === 0"><td colspan="7" class="text-center py-6 text-gray-400">No data</td></tr>
          <tr v-for="asset in assets" :key="asset.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 font-mono text-xs text-gray-600">{{ asset.asset_tag }}</td>
            <td class="px-4 py-2 font-medium text-gray-700">{{ asset.name }}</td>
            <td class="px-4 py-2 text-gray-500">{{ asset.category?.name || '—' }}</td>
            <td class="px-4 py-2 text-gray-500">{{ asset.department?.name || '—' }}</td>
            <td class="px-4 py-2 text-gray-700">৳{{ formatNumber(asset.purchase_cost) }}</td>
            <td class="px-4 py-2">
              <span :class="{
                'bg-green-100 text-green-700': asset.status === 'available',
                'bg-blue-100 text-blue-700': asset.status === 'assigned',
                'bg-red-100 text-red-700': asset.status === 'disposed',
                'bg-yellow-100 text-yellow-700': asset.status === 'under_maintenance',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ asset.status?.replace('_', ' ') }}</span>
            </td>
            <td class="px-4 py-2">
              <span :class="{
                'bg-green-100 text-green-700': asset.condition === 'good',
                'bg-yellow-100 text-yellow-700': asset.condition === 'fair',
                'bg-red-100 text-red-700': asset.condition === 'damaged',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ asset.condition }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Stock Report -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b flex justify-between items-center">
        <h3 class="font-semibold text-gray-700">Consumable Stock Report</h3>
        <span class="text-xs text-gray-400">{{ stockReport.length }} records</span>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Product</th>
            <th class="px-4 py-3">Warehouse</th>
            <th class="px-4 py-3">Quantity</th>
            <th class="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="stockReport.length === 0"><td colspan="4" class="text-center py-6 text-gray-400">No data</td></tr>
          <tr v-for="stock in stockReport" :key="stock.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 font-medium text-gray-700">{{ stock.product?.name }}</td>
            <td class="px-4 py-2 text-gray-500">{{ stock.warehouse?.name }}</td>
            <td class="px-4 py-2">
              <span :class="stock.quantity <= 0 ? 'text-red-500 font-bold' : stock.quantity <= 10 ? 'text-yellow-500 font-semibold' : 'text-green-600 font-semibold'">{{ stock.quantity }}</span>
            </td>
            <td class="px-4 py-2">
              <span :class="stock.quantity <= 0 ? 'bg-red-100 text-red-600' : stock.quantity <= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'" class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ stock.quantity <= 0 ? 'Out of Stock' : stock.quantity <= 10 ? 'Low Stock' : 'OK' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Requisition Report -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b flex justify-between items-center">
        <h3 class="font-semibold text-gray-700">Requisition Report</h3>
        <span class="text-xs text-gray-400">{{ requisitions.length }} records</span>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Reference</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="requisitions.length === 0"><td colspan="5" class="text-center py-6 text-gray-400">No data</td></tr>
          <tr v-for="req in requisitions" :key="req.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 font-medium text-blue-600">{{ req.reference }}</td>
            <td class="px-4 py-2 text-gray-700">{{ req.department?.name }}</td>
            <td class="px-4 py-2">
              <span :class="req.type === 'consumable' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'" class="px-2 py-0.5 rounded-full text-xs capitalize">{{ req.type?.replace('_', ' ') }}</span>
            </td>
            <td class="px-4 py-2">
              <span :class="{
                'bg-yellow-100 text-yellow-700': req.status === 'pending',
                'bg-green-100 text-green-700': req.status === 'fulfilled',
                'bg-red-100 text-red-700': req.status === 'rejected',
              }" class="px-2 py-0.5 rounded-full text-xs capitalize">{{ req.status }}</span>
            </td>
            <td class="px-4 py-2 text-gray-400 text-xs">{{ formatDate(req.request_date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const assets = ref([])
const stockReport = ref([])
const requisitions = ref([])
const summary = ref({})
const from = ref('')
const to = ref('')

function formatNumber(num) { return Number(num || 0).toLocaleString() }
function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchAll() {
  const params = { from: from.value, to: to.value, per_page: 100 }

  const [a, s, r, dash] = await Promise.all([
    api.get('/fixed-assets', { params: { per_page: 100 } }),
    api.get('/reports/stock', { params }),
    api.get('/requisitions', { params: { per_page: 100 } }),
    api.get('/dashboard/stats'),
  ])

  assets.value = a.data.data.data
  stockReport.value = s.data.data.data
  requisitions.value = r.data.data.data

  const stats = dash.data.data
  summary.value = {
    total_assets: stats.total_fixed_assets,
    assigned_assets: stats.assigned_assets,
    disposed_assets: assets.value.filter(a => a.status === 'disposed').length,
    pending_requisitions: stats.pending_requisitions,
  }
}

onMounted(() => fetchAll())
</script>