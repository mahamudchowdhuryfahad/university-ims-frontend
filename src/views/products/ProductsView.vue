<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Products</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add Product</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3">
      <input v-model="search" @input="fetchProducts" type="text" placeholder="Search by name, SKU, barcode..."
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filterStatus" @change="fetchProducts" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Status</option>
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Product</th>
            <th class="px-4 py-3">SKU</th>
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Stock</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="products.length === 0"><td colspan="7" class="text-center py-8 text-gray-400">No products found</td></tr>
          <tr v-for="product in products" :key="product.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ product.id }}</td>
            <td class="px-4 py-3">
              <p class="font-medium text-gray-700">{{ product.name }}</p>
              <p class="text-xs text-gray-400">{{ product.barcode }}</p>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ product.sku }}</td>
            <td class="px-4 py-3 text-gray-500">{{ product.category?.name || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="product.total_stock <= product.alert_quantity ? 'text-red-500 font-semibold' : 'text-green-600'">
                {{ product.total_stock ?? 0 }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ product.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openModal(product)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">✏️ Edit</button>
                <button @click="deleteProduct(product.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} products</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <AppModal :show="showModal" :title="editingProduct ? 'Edit Product' : 'Add Product'" max-width="max-w-lg" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveProduct" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Product Name *</label>
            <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">SKU</label>
            <input v-model="form.sku" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Barcode</label>
            <input v-model="form.barcode" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Category</label>
            <select v-model="form.category_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
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
            <label class="text-xs font-medium text-gray-600">Unit</label>
            <select v-model="form.unit" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="pcs">Pcs</option>
              <option value="kg">KG</option>
              <option value="ltr">Ltr</option>
              <option value="box">Box</option>
              <option value="set">Set</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Alert Quantity *</label>
            <input v-model="form.alert_quantity" type="number" min="0" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Description</label>
            <textarea v-model="form.description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          <div class="col-span-2 flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="is_active" />
            <label for="is_active" class="text-sm text-gray-600">Active</label>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="closeModal" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal :show="showConfirm" title="Delete Product" max-width="max-w-sm" @close="showConfirm = false">
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

const products = ref([])
const categories = ref([])
const brands = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showConfirm = ref(false)
const editingProduct = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const search = ref('')
const filterStatus = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const form = ref({ name: '', sku: '', barcode: '', category_id: '', brand_id: '', unit: 'pcs', alert_quantity: 10, description: '', is_active: true })

async function fetchProducts(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/products', { params: { page, per_page: 15, search: search.value, is_active: filterStatus.value } })
    products.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchMasterData() {
  try {
    const [c, b] = await Promise.all([
      api.get('/categories', { params: { per_page: 100 } }),
      api.get('/brands', { params: { per_page: 100 } }),
    ])
    categories.value = c.data.data.data
    brands.value = b.data.data.data
  } catch (err) {
    console.error('Failed to load master data', err)
  }
}

function openModal(product = null) {
  editingProduct.value = product
  formError.value = null
  form.value = product ? { name: product.name, sku: product.sku || '', barcode: product.barcode || '', category_id: product.category?.id || '', brand_id: product.brand?.id || '', unit: product.unit || 'pcs', alert_quantity: product.alert_quantity || 10, description: product.description || '', is_active: product.is_active }
    : { name: '', sku: '', barcode: '', category_id: '', brand_id: '', unit: 'pcs', alert_quantity: 10, description: '', is_active: true }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingProduct.value = null }

async function saveProduct() {
  saving.value = true; formError.value = null
  try {
    if (editingProduct.value) { await api.put(`/products/${editingProduct.value.id}`, form.value) }
    else { await api.post('/products', form.value) }
    closeModal(); fetchProducts()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function deleteProduct(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  try {
    await api.delete(`/products/${confirmDeleteId.value}`)
    showConfirm.value = false
    confirmDeleteId.value = null
    fetchProducts()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not delete product')
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchProducts(page)
}

onMounted(() => { fetchProducts(); fetchMasterData() })
</script>