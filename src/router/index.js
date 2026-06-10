import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/auth/RegisterView.vue'),
  },
  {
    path: '/',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },

      // All roles
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/dashboard/DashboardView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin', 'requester'] },
      },
      {
        path: 'requisitions',
        name: 'requisitions',
        component: () => import('../views/requisitions/RequisitionsView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin', 'requester'] },
      },
      {
        path: 'current-assets',
        name: 'current-assets',
        component: () => import('../views/current-assets/CurrentAssetsView.vue'),
        meta: { roles: ['super-admin', 'consumable-admin', 'store-admin', 'requester'] },
      },

      // Fixed Asset related
      {
        path: 'fixed-assets',
        name: 'fixed-assets',
        component: () => import('../views/fixed-assets/FixedAssetsView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'store-admin'] },
      },
      {
        path: 'asset-categories',
        name: 'asset-categories',
        component: () => import('../views/asset-categories/AssetCategoriesView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'store-admin'] },
      },
      {
        path: 'maintenance',
        name: 'maintenance',
        component: () => import('../views/maintenance/MaintenanceView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'store-admin'] },
      },
      {
        path: 'schools',
        name: 'schools',
        component: () => import('../views/schools/SchoolsView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'store-admin'] },
      },
      {
        path: 'departments',
        name: 'departments',
        component: () => import('../views/departments/DepartmentsView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'store-admin'] },
      },
      {
        path: 'buildings',
        name: 'buildings',
        component: () => import('../views/buildings/BuildingsView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'store-admin'] },
      },
      {
        path: 'rooms',
        name: 'rooms',
        component: () => import('../views/rooms/RoomsView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'store-admin'] },
      },
      {
        path: 'employees',
        name: 'employees',
        component: () => import('../views/employees/EmployeesView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'store-admin'] },
      },

      // Consumable related
      {
        path: 'categories',
        name: 'categories',
        component: () => import('../views/categories/CategoriesView.vue'),
        meta: { roles: ['super-admin', 'consumable-admin', 'store-admin'] },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('../views/products/ProductsView.vue'),
        meta: { roles: ['super-admin', 'consumable-admin', 'store-admin'] },
      },
      {
        path: 'brands',
        name: 'brands',
        component: () => import('../views/brands/BrandsView.vue'),
        meta: { roles: ['super-admin', 'consumable-admin', 'store-admin'] },
      },
      {
        path: 'warehouses',
        name: 'warehouses',
        component: () => import('../views/warehouses/WarehousesView.vue'),
        meta: { roles: ['super-admin', 'consumable-admin', 'store-admin'] },
      },
      {
        path: 'stock',
        name: 'stock',
        component: () => import('../views/stock/StockView.vue'),
        meta: { roles: ['super-admin', 'consumable-admin', 'store-admin'] },
      },

      // Shared
      {
        path: 'suppliers',
        name: 'suppliers',
        component: () => import('../views/suppliers/SuppliersView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin'] },
      },
      {
        path: 'purchases',
        name: 'purchases',
        component: () => import('../views/purchases/PurchasesView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin'] },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('../views/reports/ReportsView.vue'),
        meta: { roles: ['super-admin', 'fixed-asset-admin', 'consumable-admin', 'store-admin'] },
      },

      // Super Admin only
      {
        path: 'users',
        name: 'users',
        component: () => import('../views/users/UsersView.vue'),
        meta: { roles: ['super-admin'] },
      },
    ],
  },
  // 404 - catch all
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Not authenticated
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/login')
    return
  }

  // Already logged in
  if ((to.path === '/login' || to.path === '/register') && auth.isAuthenticated) {
    next('/dashboard')
    return
  }

  // Role check
  if (to.meta.roles && auth.isAuthenticated) {
    const userRole = auth.user?.roles?.[0]
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name ?? ''

    if (!to.meta.roles.includes(roleName)) {
      next('/dashboard')
      return
    }
  }

  next()
})

export default router