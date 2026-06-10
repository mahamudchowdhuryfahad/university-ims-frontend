<template>
  <div class="flex min-h-screen bg-gray-100">

    <!-- Sidebar -->
    <aside class="w-56 bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div class="p-4 border-b border-gray-700">
        <h1 class="text-lg font-bold text-white">IMS</h1>
        <p class="text-xs text-gray-400">Inventory Management</p>
      </div>

      <nav class="flex-1 overflow-y-auto py-2">
        <router-link v-for="item in visibleNavItems" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
          :class="{ 'bg-blue-600 text-white': isActive(item.to) }">
          <span>{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-700">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
            {{ auth.user?.name?.charAt(0)?.toUpperCase() }}
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ auth.user?.name }}</p>
            <p class="text-xs text-gray-400 capitalize">{{ primaryRole }}</p>
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

// All nav items with roles that can see them
const navItems = [
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: '📊',
    roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin', 'requester'],
  },
  {
    name: 'Asset Categories',
    to: '/asset-categories',
    icon: '🗂️',
    roles: ['super-admin', 'fixed-asset-admin', 'store-admin'],
  },
  {
    name: 'Fixed Assets',
    to: '/fixed-assets',
    icon: '🖥️',
    roles: ['super-admin', 'fixed-asset-admin', 'store-admin'],
  },
  {
    name: 'Consumable Categories',
    to: '/categories',
    icon: '🏷️',
    roles: ['super-admin', 'consumable-admin', 'store-admin'],
  },
  {
    name: 'Consumable Products',
    to: '/products',
    icon: '📦',
    roles: ['super-admin', 'consumable-admin', 'store-admin'],
  },
  {
    name: 'Current Assets',
    to: '/current-assets',
    icon: '📍',
    roles: ['super-admin', 'consumable-admin', 'store-admin', 'requester'],
  },
  {
    name: 'Brands',
    to: '/brands',
    icon: '🎨',
    roles: ['super-admin', 'consumable-admin', 'store-admin'],
  },
  {
    name: 'Warehouses',
    to: '/warehouses',
    icon: '🏭',
    roles: ['super-admin', 'consumable-admin', 'store-admin'],
  },
  {
    name: 'Stock',
    to: '/stock',
    icon: '📦',
    roles: ['super-admin', 'consumable-admin', 'store-admin'],
  },
  {
    name: 'Suppliers',
    to: '/suppliers',
    icon: '🚚',
    roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin'],
  },
  {
    name: 'Purchases',
    to: '/purchases',
    icon: '🛒',
    roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin'],
  },
  {
    name: 'Reports',
    to: '/reports',
    icon: '📈',
    roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin'],
  },
  {
    name: 'Users',
    to: '/users',
    icon: '👥',
    roles: ['super-admin'],
  },
  {
    name: 'Schools',
    to: '/schools',
    icon: '🏫',
    roles: ['super-admin', 'fixed-asset-admin', 'store-admin'],
  },
  {
    name: 'Departments',
    to: '/departments',
    icon: '🏢',
    roles: ['super-admin', 'fixed-asset-admin', 'store-admin'],
  },
  {
    name: 'Buildings',
    to: '/buildings',
    icon: '🏗️',
    roles: ['super-admin', 'fixed-asset-admin', 'store-admin'],
  },
  {
    name: 'Rooms',
    to: '/rooms',
    icon: '🚪',
    roles: ['super-admin', 'fixed-asset-admin', 'store-admin'],
  },
  {
    name: 'Employees',
    to: '/employees',
    icon: '👨‍💼',
    roles: ['super-admin', 'fixed-asset-admin', 'store-admin'],
  },
  {
    name: 'Requisitions',
    to: '/requisitions',
    icon: '📋',
    roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin', 'requester'],
  },
  {
    name: 'Maintenance',
    to: '/maintenance',
    icon: '🔧',
    roles: ['super-admin', 'fixed-asset-admin', 'store-admin'],
  },
]

// Get current user's primary role
const primaryRole = computed(() => {
  const roles = auth.user?.roles
  if (!roles) return ''
  if (Array.isArray(roles)) return roles[0] ?? ''
  if (typeof roles === 'object') return Object.values(roles)[0] ?? ''
  return ''
})

// Filter nav items based on role
const visibleNavItems = computed(() => {
  const role = primaryRole.value
  if (!role) return []
  return navItems.filter(item => item.roles.includes(role))
})

function isActive(to) {
  if (to === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(to)
}

const currentPageTitle = computed(() => {
  const item = navItems.find(i => isActive(i.to))
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