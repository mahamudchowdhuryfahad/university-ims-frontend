<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Sales</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ New Sale</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Invoice</th>
            <th class="px-4 py-3">Customer</th>
            <th class="px-4 py-3">Warehouse</th>
            <th class="px-4 py-3">Total</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Date</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="sales.length === 0"><td colspan="7" class="text-center py-8 text-gray-400">No sales found</td></tr>
          <tr v-for="s in sales" :key="s.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 font-medium text-blue-600">{{ s.invoice_number }}</td>
            <td class="px-4 py-3 text-gray-700">{{ s.customer?.name || 'Walk-in' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ s.warehouse?.name }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">৳{{ formatNumber(s.total_amount) }}</td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-yellow-100 text-yellow-700': s.status === 'pending',
                'bg-green-100 text-green-700': s.status === 'completed',
                'bg-red-100 text-red-700': s.status === 'cancelled',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ s.status }}</span>
            </td>
            <td class="px-4 py-3 text-gray-400 text-xs">{{ formatDate(s.sale_date) }}</td>
            <td class="px-4 py-3">
              <button @click="viewSale(s)" class="bg-purple-100 text-purple-600 hover:bg-purple-200 px-3 py-1 rounded-lg text-xs font-medium transition">👁️ View</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} sales</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- New Sale Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="showModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-700 mb-4">New Sale</h3>
        <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
        <form @submit.prevent="saveSale" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-gray-600">Warehouse *</label>
              <select v-model="form.warehouse_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
                <option value="">Select Warehouse</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Sale Date *</label>
              <input v-model="form.sale_date" type="date" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Payment Method</label>
              <select v-model="form.payment_method" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Notes</label>
              <input v-model="form.notes" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- Items -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium text-gray-600">Items *</label>
              <button type="button" @click="addItem" class="text-blue-600 text-xs hover:underline">+ Add Item</button>
            </div>
            <div v-for="(item, index) in form.items" :key="index" class="grid grid-cols-8 gap-2 mb-2 items-center">
              <div class="col-span-4">
                <select v-model="item.product_id" required class="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none">
                  <option value="">Select Product</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </div>
              <div class="col-span-2">
                <input v-model="item.quantity" type="number" min="1" placeholder="Qty" required class="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none" />
              </div>
              <div class="col-span-1">
                <input v-model="item.unit_price" type="number" min="0" placeholder="Price" required class="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none" />
              </div>
              <div class="col-span-1 text-center">
                <button type="button" @click="removeItem(index)" class="text-red-500 hover:text-red-700 text-lg">×</button>
              </div>
            </div>
            <div class="text-right text-sm font-semibold text-gray-700 mt-2">
              Total: ৳{{ formatNumber(totalAmount) }}
            </div>
          </div>

          <div class="flex gap-3">
            <button type="button" @click="showModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" :disabled="saving" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition disabled:opacity-50">{{ saving ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Modal -->
    <div v-if="showViewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="showViewModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-700">Sale Details</h3>
          <button @click="showViewModal = false" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div v-if="selectedSale" class="space-y-4">
          <div class="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-500">Invoice:</span> <span class="font-medium">{{ selectedSale.invoice_number }}</span></div>
            <div><span class="text-gray-500">Status:</span> <span class="font-medium capitalize ml-1">{{ selectedSale.status }}</span></div>
            <div><span class="text-gray-500">Customer:</span> <span class="font-medium">{{ selectedSale.customer?.name || 'Walk-in' }}</span></div>
            <div><span class="text-gray-500">Warehouse:</span> <span class="font-medium">{{ selectedSale.warehouse?.name }}</span></div>
            <div><span class="text-gray-500">Total:</span> <span class="font-medium">৳{{ formatNumber(selectedSale.total_amount) }}</span></div>
            <div><span class="text-gray-500">Date:</span> <span class="font-medium">{{ formatDate(selectedSale.sale_date) }}</span></div>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-600 mb-2">Items</h4>
            <table class="w-full text-sm border rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr class="text-left text-gray-500">
                  <th class="px-3 py-2">Product</th>
                  <th class="px-3 py-2">Qty</th>
                  <th class="px-3 py-2">Unit Price</th>
                  <th class="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedSale.items" :key="item.id" class="border-t">
                  <td class="px-3 py-2">{{ item.product?.name }}</td>
                  <td class="px-3 py-2">{{ item.quantity }}</td>
                  <td class="px-3 py-2">৳{{ formatNumber(item.unit_price) }}</td>
                  <td class="px-3 py-2">৳{{ formatNumber(item.total_price) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'

const sales = ref([])
const warehouses = ref([])
const products = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showViewModal = ref(false)
const selectedSale = ref(null)
const formError = ref(null)
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })

const form = ref({
  warehouse_id: '', sale_date: new Date().toISOString().split('T')[0],
  payment_method: 'cash', notes: '',
  items: [{ product_id: '', quantity: 1, unit_price: 0 }],
})

const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0)
})

function formatNumber(num) { return Number(num || 0).toLocaleString() }
function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchSales(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/sales', { params: { page, per_page: 15 } })
    sales.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchMasterData() {
  const [w, p] = await Promise.all([
    api.get('/warehouses', { params: { per_page: 100 } }),
    api.get('/products', { params: { per_page: 100 } }),
  ])
  warehouses.value = w.data.data.data
  products.value = p.data.data.data
}

function openModal() {
  form.value = { warehouse_id: '', sale_date: new Date().toISOString().split('T')[0], payment_method: 'cash', notes: '', items: [{ product_id: '', quantity: 1, unit_price: 0 }] }
  formError.value = null
  showModal.value = true
}

function addItem() { form.value.items.push({ product_id: '', quantity: 1, unit_price: 0 }) }
function removeItem(index) { if (form.value.items.length > 1) form.value.items.splice(index, 1) }

async function saveSale() {
  saving.value = true; formError.value = null
  try {
    await api.post('/sales', form.value)
    showModal.value = false; fetchSales()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

async function viewSale(s) {
  const res = await api.get(`/sales/${s.id}`)
  selectedSale.value = res.data.data
  showViewModal.value = true
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchSales(page)
}

onMounted(() => { fetchSales(); fetchMasterData() })
</script>