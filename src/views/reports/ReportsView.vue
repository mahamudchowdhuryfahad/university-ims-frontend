<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Reports</h2>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-1 flex gap-1 w-fit flex-wrap">
      <button @click="activeTab = 'fixed-assets'" :class="activeTab === 'fixed-assets' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'" class="px-4 py-2 rounded-lg text-sm font-medium transition">Fixed Assets</button>
      <button @click="activeTab = 'depreciation'; fetchDepreciationReport()" :class="activeTab === 'depreciation' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'" class="px-4 py-2 rounded-lg text-sm font-medium transition">Depreciation</button>
      <button @click="activeTab = 'stock'" :class="activeTab === 'stock' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'" class="px-4 py-2 rounded-lg text-sm font-medium transition">Consumable Stock</button>
      <button @click="activeTab = 'requisitions'" :class="activeTab === 'requisitions' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'" class="px-4 py-2 rounded-lg text-sm font-medium transition">Requisitions</button>
    </div>

    <div v-if="activeTab === 'fixed-assets'" class="space-y-4">
      <div class="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label class="text-xs font-medium text-gray-600">Category</label>
          <select v-model="faFilter.category_id" @change="fetchFixedAssetReports" class="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">All Categories</option>
            <option v-for="c in assetCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Department</label>
          <select v-model="faFilter.department_id" @change="fetchFixedAssetReports" class="w-44 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">All Departments</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Status</label>
          <select v-model="faFilter.status" @change="fetchFixedAssetReports" class="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">All Status</option>
            <option value="in_store">In Store</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="under_maintenance">Maintenance</option>
            <option value="disposed">Disposed</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Group By</label>
          <select v-model="faFilter.group_by" @change="fetchFixedAssetReports" class="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="department">Department</option>
            <option value="room">Room</option>
            <option value="category">Category</option>
          </select>
        </div>
        <div class="flex gap-2 ml-auto">
          <button @click="exportReport('excel')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-1">Export Excel</button>
          <button @click="exportReport('pdf')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-1">Export PDF</button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <p class="text-2xl font-bold text-gray-700">{{ faSummary.total || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Assets</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ faSummary.available || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Available</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <p class="text-2xl font-bold text-blue-600">{{ faSummary.assigned || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Assigned</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <p class="text-2xl font-bold text-purple-600">Tk {{ formatNumber(faSummary.total_cost || 0) }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Cost</p>
        </div>
      </div>

      <div v-if="faFilter.group_by === 'department'" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-4 py-3 border-b">
          <h3 class="font-semibold text-gray-700">Assets by Department</h3>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr class="text-left text-gray-500">
              <th class="px-4 py-3">#</th>
              <th class="px-4 py-3">Department</th>
              <th class="px-4 py-3">Total Assets</th>
              <th class="px-4 py-3">Available</th>
              <th class="px-4 py-3">Assigned</th>
              <th class="px-4 py-3">In Store</th>
              <th class="px-4 py-3">Disposed</th>
              <th class="px-4 py-3">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingFA"><td colspan="8" class="text-center py-8 text-gray-400">Loading...</td></tr>
            <tr v-else-if="faByDept.length === 0"><td colspan="8" class="text-center py-8 text-gray-400">No data</td></tr>
            <tr v-for="(row, i) in faByDept" :key="i" class="border-b hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-400">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-medium text-gray-700">{{ row.department_name }}</td>
              <td class="px-4 py-3"><span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">{{ row.total }}</span></td>
              <td class="px-4 py-3 text-green-600 font-medium">{{ row.by_status?.available || 0 }}</td>
              <td class="px-4 py-3 text-blue-600 font-medium">{{ row.by_status?.assigned || 0 }}</td>
              <td class="px-4 py-3 text-purple-600 font-medium">{{ row.by_status?.in_store || 0 }}</td>
              <td class="px-4 py-3 text-red-500 font-medium">{{ row.by_status?.disposed || 0 }}</td>
              <td class="px-4 py-3 text-gray-700">Tk {{ formatNumber(row.total_cost) }}</td>
            </tr>
            <tr v-if="faByDept.length > 0" class="bg-blue-50 font-semibold">
              <td colspan="2" class="px-4 py-3 text-gray-700">Total</td>
              <td class="px-4 py-3">{{ faByDept.reduce((s, r) => s + r.total, 0) }}</td>
              <td class="px-4 py-3 text-green-600">{{ faByDept.reduce((s, r) => s + (r.by_status?.available || 0), 0) }}</td>
              <td class="px-4 py-3 text-blue-600">{{ faByDept.reduce((s, r) => s + (r.by_status?.assigned || 0), 0) }}</td>
              <td class="px-4 py-3 text-purple-600">{{ faByDept.reduce((s, r) => s + (r.by_status?.in_store || 0), 0) }}</td>
              <td class="px-4 py-3 text-red-500">{{ faByDept.reduce((s, r) => s + (r.by_status?.disposed || 0), 0) }}</td>
              <td class="px-4 py-3">Tk {{ formatNumber(faByDept.reduce((s, r) => s + Number(r.total_cost || 0), 0)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="faFilter.group_by === 'room'" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-4 py-3 border-b">
          <h3 class="font-semibold text-gray-700">Assets by Room</h3>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr class="text-left text-gray-500">
              <th class="px-4 py-3">#</th>
              <th class="px-4 py-3">Room</th>
              <th class="px-4 py-3">Department</th>
              <th class="px-4 py-3">Total Assets</th>
              <th class="px-4 py-3">Categories</th>
              <th class="px-4 py-3">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingFA"><td colspan="6" class="text-center py-8 text-gray-400">Loading...</td></tr>
            <tr v-else-if="faByRoom.length === 0"><td colspan="6" class="text-center py-8 text-gray-400">No data</td></tr>
            <tr v-for="(row, i) in faByRoom" :key="i" class="border-b hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-400">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-medium text-gray-700">{{ row.room_name }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ row.department }}</td>
              <td class="px-4 py-3"><span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">{{ row.total }}</span></td>
              <td class="px-4 py-3 text-xs text-gray-500">
                <span v-for="(count, cat) in row.categories" :key="cat" class="mr-2">{{ cat }}: <strong>{{ count }}</strong></span>
              </td>
              <td class="px-4 py-3 text-gray-700">Tk {{ formatNumber(row.total_cost) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="faFilter.group_by === 'category'" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-4 py-3 border-b">
          <h3 class="font-semibold text-gray-700">Assets by Category</h3>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr class="text-left text-gray-500">
              <th class="px-4 py-3">#</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Total</th>
              <th class="px-4 py-3">Available</th>
              <th class="px-4 py-3">Assigned</th>
              <th class="px-4 py-3">In Store</th>
              <th class="px-4 py-3">Disposed</th>
              <th class="px-4 py-3">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingFA"><td colspan="8" class="text-center py-8 text-gray-400">Loading...</td></tr>
            <tr v-else-if="faByCategory.length === 0"><td colspan="8" class="text-center py-8 text-gray-400">No data</td></tr>
            <tr v-for="(row, i) in faByCategory" :key="i" class="border-b hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-400">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-medium text-gray-700">{{ row.category_name }}</td>
              <td class="px-4 py-3"><span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">{{ row.total }}</span></td>
              <td class="px-4 py-3 text-green-600 font-medium">{{ row.by_status?.available || 0 }}</td>
              <td class="px-4 py-3 text-blue-600 font-medium">{{ row.by_status?.assigned || 0 }}</td>
              <td class="px-4 py-3 text-purple-600 font-medium">{{ row.by_status?.in_store || 0 }}</td>
              <td class="px-4 py-3 text-red-500 font-medium">{{ row.by_status?.disposed || 0 }}</td>
              <td class="px-4 py-3 text-gray-700">Tk {{ formatNumber(row.total_cost) }}</td>
            </tr>
            <tr v-if="faByCategory.length > 0" class="bg-blue-50 font-semibold">
              <td colspan="2" class="px-4 py-3 text-gray-700">Total</td>
              <td class="px-4 py-3">{{ faByCategory.reduce((s, r) => s + r.total, 0) }}</td>
              <td class="px-4 py-3 text-green-600">{{ faByCategory.reduce((s, r) => s + (r.by_status?.available || 0), 0) }}</td>
              <td class="px-4 py-3 text-blue-600">{{ faByCategory.reduce((s, r) => s + (r.by_status?.assigned || 0), 0) }}</td>
              <td class="px-4 py-3 text-purple-600">{{ faByCategory.reduce((s, r) => s + (r.by_status?.in_store || 0), 0) }}</td>
              <td class="px-4 py-3 text-red-500">{{ faByCategory.reduce((s, r) => s + (r.by_status?.disposed || 0), 0) }}</td>
              <td class="px-4 py-3">Tk {{ formatNumber(faByCategory.reduce((s, r) => s + Number(r.total_cost || 0), 0)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'depreciation'" class="space-y-4">
      <div class="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label class="text-xs font-medium text-gray-600">Category</label>
          <select v-model="depFilter.category_id" @change="fetchDepreciationReport" class="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">All Categories</option>
            <option v-for="c in assetCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Department</label>
          <select v-model="depFilter.department_id" @change="fetchDepreciationReport" class="w-44 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">All Departments</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div class="flex gap-2 ml-auto">
          <button @click="exportDepreciation('excel')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-1">Export Excel</button>
          <button @click="exportDepreciation('pdf')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-1">Export PDF</button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <p class="text-2xl font-bold text-gray-700">{{ depSummary.asset_count || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Assets</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <p class="text-2xl font-bold text-blue-600">Tk {{ formatNumber(depSummary.total_purchase_cost || 0) }}</p>
          <p class="text-xs text-gray-500 mt-1">Purchase Cost</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <p class="text-2xl font-bold text-red-500">Tk {{ formatNumber(depSummary.total_depreciation || 0) }}</p>
          <p class="text-xs text-gray-500 mt-1">Accumulated Depreciation</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <p class="text-2xl font-bold text-green-600">Tk {{ formatNumber(depSummary.total_current_value || 0) }}</p>
          <p class="text-xs text-gray-500 mt-1">Current Value (WDV)</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-4 py-3 border-b flex justify-between items-center">
          <h3 class="font-semibold text-gray-700">Depreciation Report</h3>
          <span class="text-xs text-gray-400">{{ depAssets.length }} records</span>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr class="text-left text-gray-500">
              <th class="px-4 py-3">#</th>
              <th class="px-4 py-3">Asset Tag</th>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Department</th>
              <th class="px-4 py-3">Purchase Date</th>
              <th class="px-4 py-3">Cost</th>
              <th class="px-4 py-3">Rate</th>
              <th class="px-4 py-3">Years</th>
              <th class="px-4 py-3">Depreciation</th>
              <th class="px-4 py-3">Current Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingDep"><td colspan="10" class="text-center py-8 text-gray-400">Loading...</td></tr>
            <tr v-else-if="depAssets.length === 0"><td colspan="10" class="text-center py-8 text-gray-400">No data</td></tr>
            <tr v-for="(a, i) in depAssets" :key="a.id" class="border-b hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-400">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-600">{{ a.asset_tag }}</td>
              <td class="px-4 py-3 font-medium text-gray-700">{{ a.name }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ a.department || '-' }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ a.purchase_date }}</td>
              <td class="px-4 py-3 text-gray-700">Tk {{ formatNumber(a.purchase_cost) }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ (a.depreciation_rate * 100).toFixed(0) }}%</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ Math.floor(a.years_in_use) }} years</td>
              <td class="px-4 py-3 text-red-500">Tk {{ formatNumber(a.accumulated_depreciation) }}</td>
              <td class="px-4 py-3 text-green-600 font-medium">Tk {{ formatNumber(a.current_value) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'stock'" class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b flex justify-between items-center">
        <h3 class="font-semibold text-gray-700">Consumable Stock Report</h3>
        <span class="text-xs text-gray-400">{{ stockReport.length }} records</span>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Product</th>
            <th class="px-4 py-3">Warehouse</th>
            <th class="px-4 py-3">Quantity</th>
            <th class="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingStock"><td colspan="5" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="stockReport.length === 0"><td colspan="5" class="text-center py-8 text-gray-400">No data</td></tr>
          <tr v-for="(stock, i) in stockReport" :key="stock.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-400">{{ i + 1 }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">{{ stock.product?.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ stock.warehouse?.name }}</td>
            <td class="px-4 py-3">
              <span :class="stock.quantity <= 0 ? 'text-red-500 font-bold' : stock.quantity <= 10 ? 'text-yellow-500 font-semibold' : 'text-green-600 font-semibold'">{{ stock.quantity }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="stock.quantity <= 0 ? 'bg-red-100 text-red-600' : stock.quantity <= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'" class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ stock.quantity <= 0 ? 'Out of Stock' : stock.quantity <= 10 ? 'Low Stock' : 'OK' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'requisitions'" class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b flex justify-between items-center">
        <h3 class="font-semibold text-gray-700">Requisition Report</h3>
        <span class="text-xs text-gray-400">{{ requisitions.length }} records</span>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Reference</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingReq"><td colspan="6" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="requisitions.length === 0"><td colspan="6" class="text-center py-8 text-gray-400">No data</td></tr>
          <tr v-for="(req, i) in requisitions" :key="req.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-400">{{ i + 1 }}</td>
            <td class="px-4 py-3 font-medium text-blue-600">{{ req.reference }}</td>
            <td class="px-4 py-3 text-gray-700">{{ req.department?.name }}</td>
            <td class="px-4 py-3">
              <span :class="req.type === 'consumable' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'" class="px-2 py-0.5 rounded-full text-xs capitalize">{{ req.type?.replace('_', ' ') }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-yellow-100 text-yellow-700': req.status === 'pending',
                'bg-green-100 text-green-700': req.status === 'fulfilled' || req.status === 'approved',
                'bg-red-100 text-red-700': req.status === 'rejected',
              }" class="px-2 py-0.5 rounded-full text-xs capitalize">{{ req.status }}</span>
            </td>
            <td class="px-4 py-3 text-gray-400 text-xs">{{ formatDate(req.request_date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../../services/api'

const activeTab = ref('fixed-assets')

const faFilter = ref({ category_id: '', department_id: '', status: '', group_by: 'department' })
const faSummary = ref({})
const faByDept = ref([])
const faByRoom = ref([])
const faByCategory = ref([])
const loadingFA = ref(false)
const assetCategories = ref([])
const departments = ref([])

const depFilter = ref({ category_id: '', department_id: '' })
const depSummary = ref({})
const depAssets = ref([])
const loadingDep = ref(false)

const stockReport = ref([])
const requisitions = ref([])
const loadingStock = ref(false)
const loadingReq = ref(false)

function formatNumber(num) { return Number(num || 0).toLocaleString() }
function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchMasterData() {
  const load = async (url, target) => {
    try {
      const res = await api.get(url, { params: { per_page: 200 } })
      target.value = res.data.data.data
    } catch { target.value = [] }
  }
  await Promise.all([
    load('/asset-categories', assetCategories),
    load('/departments', departments),
  ])
}

async function fetchFixedAssetReports() {
  loadingFA.value = true
  try {
    const params = {
      category_id: faFilter.value.category_id || undefined,
      department_id: faFilter.value.department_id || undefined,
      status: faFilter.value.status || undefined,
    }
    const [summary, byDept, byRoom, byCategory] = await Promise.all([
      api.get('/reports/fixed-assets/summary', { params }),
      api.get('/reports/fixed-assets/by-department', { params }),
      api.get('/reports/fixed-assets/by-room', { params }),
      api.get('/reports/fixed-assets/by-category', { params }),
    ])
    faSummary.value = summary.data.data
    faByDept.value = byDept.data.data
    faByRoom.value = byRoom.data.data
    faByCategory.value = byCategory.data.data
  } catch (err) {
    console.error('Failed to load fixed asset reports', err)
  } finally {
    loadingFA.value = false
  }
}

async function fetchDepreciationReport() {
  loadingDep.value = true
  try {
    const params = {
      category_id: depFilter.value.category_id || undefined,
      department_id: depFilter.value.department_id || undefined,
    }
    const res = await api.get('/reports/fixed-assets/depreciation', { params })
    depSummary.value = res.data.data.summary
    depAssets.value = res.data.data.assets
  } catch (err) {
    console.error('Failed to load depreciation report', err)
  } finally {
    loadingDep.value = false
  }
}

async function fetchOtherReports() {
  loadingStock.value = true
  loadingReq.value = true
  try {
    const [s, r] = await Promise.all([
      api.get('/reports/stock', { params: { per_page: 200 } }),
      api.get('/requisitions', { params: { per_page: 200 } }),
    ])
    stockReport.value = s.data.data.data
    requisitions.value = r.data.data.data
  } catch (err) {
    console.error(err)
  } finally {
    loadingStock.value = false
    loadingReq.value = false
  }
}

function exportDepreciation(type) {
  const params = new URLSearchParams()
  params.set('type', type)
  if (depFilter.value.category_id) params.set('category_id', depFilter.value.category_id)
  if (depFilter.value.department_id) params.set('department_id', depFilter.value.department_id)

  const token = localStorage.getItem('token')
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost/inventory-management-system/public/api/v1'
  const url = `${baseUrl}/reports/fixed-assets/depreciation-export?${params.toString()}`

  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const ext = type === 'excel' ? 'csv' : 'html'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `depreciation-report.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
    })
    .catch(err => alert('Export failed: ' + err.message))
}

function exportReport(type) {
  const params = new URLSearchParams()
  params.set('type', type)
  params.set('group_by', faFilter.value.group_by)
  if (faFilter.value.category_id) params.set('category_id', faFilter.value.category_id)
  if (faFilter.value.department_id) params.set('department_id', faFilter.value.department_id)
  if (faFilter.value.status) params.set('status', faFilter.value.status)

  const token = localStorage.getItem('token')
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost/inventory-management-system/public/api/v1'
  const url = `${baseUrl}/reports/fixed-assets/export?${params.toString()}`

  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const ext = type === 'excel' ? 'csv' : 'html'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `fixed-assets-report.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
    })
    .catch(err => alert('Export failed: ' + err.message))
}

watch(activeTab, (tab) => {
  if (tab === 'stock' || tab === 'requisitions') fetchOtherReports()
})

onMounted(() => {
  fetchMasterData()
  fetchFixedAssetReports()
})
</script>
