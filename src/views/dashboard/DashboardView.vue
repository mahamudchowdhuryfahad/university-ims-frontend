<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold text-gray-700">Dashboard</h2>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="stat in stats" :key="stat.label"
        class="bg-white rounded-xl shadow-sm p-4 text-center">
        <div class="text-3xl mb-2">{{ stat.icon }}</div>
        <p class="text-2xl font-bold text-gray-700">{{ stat.value }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Fixed Assets by Status -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Asset Status Overview</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span class="text-sm text-gray-600">Available</span>
            </div>
            <span class="font-semibold text-gray-700">{{ statsData.available_assets || 0 }}</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <span class="text-sm text-gray-600">Assigned</span>
            </div>
            <span class="font-semibold text-gray-700">{{ statsData.assigned_assets || 0 }}</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span class="text-sm text-gray-600">Under Maintenance</span>
            </div>
            <span class="font-semibold text-gray-700">{{ statsData.under_maintenance_assets || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">University Overview</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">🏫 Schools</span>
            <span class="font-semibold text-gray-700">{{ statsData.total_schools || 0 }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">🏢 Departments</span>
            <span class="font-semibold text-gray-700">{{ statsData.total_departments || 0 }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">👨‍💼 Employees</span>
            <span class="font-semibold text-gray-700">{{ statsData.total_employees || 0 }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">📋 Pending Requisitions</span>
            <span class="font-semibold text-orange-500">{{ statsData.pending_requisitions || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Stock Alert -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b flex justify-between items-center">
        <h3 class="font-semibold text-gray-700">⚠️ Low Stock Alert</h3>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Product</th>
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Stock</th>
            <th class="px-4 py-3">Alert Qty</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingStats">
            <td colspan="4" class="text-center py-6 text-gray-400">Loading...</td>
          </tr>
          <tr v-else-if="lowStock.length === 0">
            <td colspan="4" class="text-center py-6 text-gray-400">✅ All stock levels are OK</td>
          </tr>
          <tr v-for="product in lowStock" :key="product.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 font-medium text-gray-700">{{ product.name }}</td>
            <td class="px-4 py-2 text-gray-500">{{ product.category?.name || '—' }}</td>
            <td class="px-4 py-2">
              <span class="text-red-500 font-bold">{{ product.total_stock ?? 0 }}</span>
            </td>
            <td class="px-4 py-2 text-gray-400">{{ product.alert_quantity }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'

const statsData = ref({})
const lowStock = ref([])
const loadingStats = ref(false)

const stats = computed(() => [
  { label: 'Total Fixed Assets',   value: statsData.value.total_fixed_assets || 0,       icon: '🖥️' },
  { label: 'Assigned Assets',      value: statsData.value.assigned_assets || 0,           icon: '👤' },
  { label: 'Total Products',       value: statsData.value.total_products || 0,            icon: '📦' },
  { label: 'Pending Requisitions', value: statsData.value.pending_requisitions || 0,      icon: '📋' },
  { label: 'Total Schools',        value: statsData.value.total_schools || 0,             icon: '🏫' },
  { label: 'Departments',          value: statsData.value.total_departments || 0,         icon: '🏢' },
  { label: 'Employees',            value: statsData.value.total_employees || 0,           icon: '👨‍💼' },
  { label: 'Under Maintenance',    value: statsData.value.under_maintenance_assets || 0,  icon: '🔧' },
])

async function fetchStats() {
  try {
    const res = await api.get('/dashboard/stats')
    statsData.value = res.data.data
  } catch (err) {
    console.error('Failed to load dashboard stats', err)
  }
}

async function fetchLowStock() {
  loadingStats.value = true
  try {
    const res = await api.get('/dashboard/low-stock')
    lowStock.value = res.data.data
  } catch (err) {
    console.error('Failed to load low stock', err)
  } finally {
    loadingStats.value = false
  }
}

onMounted(() => {
  fetchStats()
  fetchLowStock()
})
</script>