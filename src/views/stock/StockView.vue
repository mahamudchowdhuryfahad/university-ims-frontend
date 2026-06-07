<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Stock Management</h2>
      <button @click="openAdjustModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Adjust Stock</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
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
          <tr v-if="loading"><td colspan="5" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="stocks.length === 0"><td colspan="5" class="text-center py-8 text-gray-400">No stock found</td></tr>
          <tr v-for="stock in stocks" :key="stock.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ stock.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">{{ stock.product?.name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ stock.warehouse?.name || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="stock.quantity <= 0 ? 'text-red-500 font-bold' : stock.quantity <= 10 ? 'text-yellow-500 font-semibold' : 'text-green-600 font-semibold'">
                {{ stock.quantity }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="stock.quantity <= 0 ? 'bg-red-100 text-red-600' : stock.quantity <= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'"
                class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ stock.quantity <= 0 ? '❌ Out of Stock' : stock.quantity <= 10 ? '⚠️ Low Stock' : '✅ OK' }}
              </span>
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

    <!-- Adjust Modal -->
    <div v-if="showAdjustModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="showAdjustModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-700 mb-4">Adjust Stock</h3>
        <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
        <form @submit.prevent="adjustStock" class="space-y-3">
          <div>
            <label class="text-xs font-medium text-gray-600">Product *</label>
            <select v-model="form.product_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Product</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Warehouse *</label>
            <select v-model="form.warehouse_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Warehouse</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Type *</label>
            <select v-model="form.type" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="add">Add Stock</option>
              <option value="subtract">Subtract Stock</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Quantity *</label>
            <input v-model="form.quantity" type="number" min="1" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Note</label>
            <input v-model="form.note" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="showAdjustModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" :disabled="saving" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition disabled:opacity-50">{{ saving ? 'Saving...' : 'Adjust' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const stocks = ref([])
const products = ref([])
const warehouses = ref([])
const loading = ref(false)
const saving = ref(false)
const showAdjustModal = ref(false)
const formError = ref(null)
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const form = ref({ product_id: '', warehouse_id: '', type: 'add', quantity: 1, note: '' })

async function fetchStocks(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/stock', { params: { page, per_page: 15 } })
    stocks.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchMasterData() {
  const [p, w] = await Promise.all([
    api.get('/products', { params: { per_page: 100 } }),
    api.get('/warehouses', { params: { per_page: 100 } }),
  ])
  products.value = p.data.data.data
  warehouses.value = w.data.data.data
}

function openAdjustModal() {
  form.value = { product_id: '', warehouse_id: '', type: 'add', quantity: 1, note: '' }
  formError.value = null
  showAdjustModal.value = true
}

async function adjustStock() {
  saving.value = true; formError.value = null
  try {
    await api.post('/stock/adjust', form.value)
    showAdjustModal.value = false; fetchStocks()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchStocks(page)
}

onMounted(() => { fetchStocks(); fetchMasterData() })
</script>