<template>
  <div class="flex min-h-screen bg-gray-100">

    <!-- Sidebar -->
    <aside class="w-56 bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div class="p-4 border-b border-gray-700">
        <h1 class="text-lg font-bold text-white">IMS</h1>
        <p class="text-xs text-gray-400">Inventory Management</p>
      </div>

      <nav class="flex-1 overflow-y-auto py-2">
        <router-link v-for="item in navItems" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
          :class="{ 'bg-blue-600 text-white': $route.path.startsWith(item.to) }">
          <span>{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-700">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
            {{ auth.user?.name?.charAt(0) }}
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ auth.user?.name }}</p>
            <p class="text-xs text-gray-400">{{ auth.user?.roles?.[0] }}</p>
          </div>
        </div>
        <button @click="handleLogout"
          class="w-full text-left text-xs text-red-400 hover:text-red-300 transition flex items-center gap-2">
          🚪 Logout
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-h-screen">
      <header class="bg-white shadow-sm px-6 py-3 flex justify-between items-center sticky top-0 z-10">
        <h2 class="text-sm font-semibold text-gray-600">{{ currentPageTitle }}</h2>
        <span class="text-xs text-gray-400">{{ currentDate }}</span>
      </header>

      <main class="flex-1 p-6 bg-gray-100">
        <router-view />
      </main>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const navItems = [
  { name: 'Dashboard',        to: '/dashboard',        icon: '📊' },
  { name: 'Asset Categories', to: '/asset-categories', icon: '🗂️' },
  { name: 'Fixed Assets',     to: '/fixed-assets',     icon: '🖥️' },
  { name: 'Consumable Categories', to: '/categories',  icon: '🏷️' },
  { name: 'Products',         to: '/products',         icon: '📦' },
  { name: 'Current Assets',   to: '/current-assets',   icon: '📍'  },
  { name: 'Brands',           to: '/brands',           icon: '🏷️' },
  { name: 'Warehouses',       to: '/warehouses',       icon: '🏭' },
  { name: 'Stock',            to: '/stock',            icon: '📋' },
  { name: 'Suppliers',        to: '/suppliers',        icon: '🚚' },
  { name: 'Purchases',        to: '/purchases',        icon: '🛒' },
  { name: 'Reports',          to: '/reports',          icon: '📈' },
  { name: 'Users',            to: '/users',            icon: '👥' },
  { name: 'Schools',          to: '/schools',          icon: '🏫' },
  { name: 'Departments',      to: '/departments',      icon: '🏢' },
  { name: 'Buildings',        to: '/buildings',        icon: '🏗️' },
  { name: 'Rooms',            to: '/rooms',            icon: '🚪' },
  { name: 'Employees',        to: '/employees',        icon: '👨‍💼' },
  { name: 'Requisitions',     to: '/requisitions',     icon: '📋' },
  { name: 'Maintenance',      to: '/maintenance',      icon: '🔧' },
]

const currentPageTitle = computed(() => {
  const item = navItems.find(i => route.path.startsWith(i.to))
  return item?.name || 'IMS'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
})

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>