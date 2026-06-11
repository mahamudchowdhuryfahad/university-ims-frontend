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

    <!-- Charts Row -->
    <div class="grid grid-cols-2 gap-4">

      <!-- Asset Status Doughnut -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm font-semibold text-gray-700 mb-3">Asset Status</p>
        <div class="flex gap-3 flex-wrap mb-3">
          <span v-for="item in assetLegend" :key="item.label"
            class="flex items-center gap-1 text-xs text-gray-500">
            <span class="w-2.5 h-2.5 rounded-sm inline-block" :style="{ background: item.color }"></span>
            {{ item.label }} {{ item.value }}
          </span>
        </div>
        <div style="position: relative; height: 200px;">
          <canvas id="assetChart"></canvas>
        </div>
      </div>

      <!-- University Overview Bar -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm font-semibold text-gray-700 mb-3">University Overview</p>
        <div style="position: relative; height: 220px;">
          <canvas id="uniChart"></canvas>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { Chart, ArcElement, DoughnutController, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import api from '../../services/api'

Chart.register(ArcElement, DoughnutController, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend)

const statsData = ref({})
const lowStock = ref([])
const loadingStats = ref(false)

let assetChartInstance = null
let uniChartInstance = null

const stats = computed(() => [
  { label: 'Total Fixed Assets',   value: statsData.value.total_fixed_assets || 0,      icon: '🖥️' },
  { label: 'Assigned Assets',      value: statsData.value.assigned_assets || 0,          icon: '👤' },
  { label: 'Total Products',       value: statsData.value.total_products || 0,           icon: '📦' },
  { label: 'Pending Requisitions', value: statsData.value.pending_requisitions || 0,     icon: '📋' },
  { label: 'Total Schools',        value: statsData.value.total_schools || 0,            icon: '🏫' },
  { label: 'Departments',          value: statsData.value.total_departments || 0,        icon: '🏢' },
  { label: 'Employees',            value: statsData.value.total_employees || 0,          icon: '👨‍💼' },
  { label: 'Under Maintenance',    value: statsData.value.under_maintenance_assets || 0, icon: '🔧' },
])

const assetLegend = computed(() => [
  { label: 'In Store',     value: statsData.value.in_store_assets || 0,           color: '#8b5cf6' },
  { label: 'Available',    value: statsData.value.available_assets || 0,          color: '#22c55e' },
  { label: 'Assigned',     value: statsData.value.assigned_assets || 0,           color: '#3b82f6' },
  { label: 'Maintenance',  value: statsData.value.under_maintenance_assets || 0,  color: '#f59e0b' },
  { label: 'Disposed',     value: statsData.value.disposed_assets || 0,           color: '#ef4444' },
])

function renderAssetChart() {
  const ctx = document.getElementById('assetChart')
  if (!ctx) return
  if (assetChartInstance) assetChartInstance.destroy()

  assetChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: assetLegend.value.map(i => i.label),
      datasets: [{
        data: assetLegend.value.map(i => i.value),
        backgroundColor: assetLegend.value.map(i => i.color),
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + ctx.label + ': ' + ctx.parsed } }
      }
    }
  })
}

function renderUniChart() {
  const ctx = document.getElementById('uniChart')
  if (!ctx) return
  if (uniChartInstance) uniChartInstance.destroy()

  uniChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Schools', 'Departments', 'Employees', 'Pending Req.'],
      datasets: [{
        data: [
          statsData.value.total_schools || 0,
          statsData.value.total_departments || 0,
          statsData.value.total_employees || 0,
          statsData.value.pending_requisitions || 0,
        ],
        backgroundColor: ['#185FA5', '#185FA5', '#185FA5', '#BA7517'],
        borderRadius: 4,
        borderWidth: 0,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: 'rgba(128,128,128,0.1)' },
          ticks: { stepSize: 1 }
        },
        y: { grid: { display: false } }
      }
    }
  })
}

async function fetchStats() {
  try {
    const res = await api.get('/dashboard/stats')
    statsData.value = res.data.data
    await nextTick()
    renderAssetChart()
    renderUniChart()
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