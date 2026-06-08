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
      { path: 'dashboard',        name: 'dashboard',        component: () => import('../views/dashboard/DashboardView.vue') },
      { path: 'products',         name: 'products',         component: () => import('../views/products/ProductsView.vue') },
      { path: 'categories',       name: 'categories',       component: () => import('../views/categories/CategoriesView.vue') },
      { path: 'brands',           name: 'brands',           component: () => import('../views/brands/BrandsView.vue') },
      { path: 'warehouses',       name: 'warehouses',       component: () => import('../views/warehouses/WarehousesView.vue') },
      { path: 'stock',            name: 'stock',            component: () => import('../views/stock/StockView.vue') },
      { path: 'suppliers',        name: 'suppliers',        component: () => import('../views/suppliers/SuppliersView.vue') },
      { path: 'purchases',        name: 'purchases',        component: () => import('../views/purchases/PurchasesView.vue') },
      { path: 'reports',          name: 'reports',          component: () => import('../views/reports/ReportsView.vue') },
      { path: 'users',            name: 'users',            component: () => import('../views/users/UsersView.vue') },
      { path: 'schools',          name: 'schools',          component: () => import('../views/schools/SchoolsView.vue') },
      { path: 'departments',      name: 'departments',      component: () => import('../views/departments/DepartmentsView.vue') },
      { path: 'buildings',        name: 'buildings',        component: () => import('../views/buildings/BuildingsView.vue') },
      { path: 'rooms',            name: 'rooms',            component: () => import('../views/rooms/RoomsView.vue') },
      { path: 'employees',        name: 'employees',        component: () => import('../views/employees/EmployeesView.vue') },
      { path: 'fixed-assets',     name: 'fixed-assets',     component: () => import('../views/fixed-assets/FixedAssetsView.vue') },
      { path: 'current-assets',   name: 'current-assets',   component: () => import('../views/current-assets/CurrentAssetsView.vue') },
      { path: 'asset-categories', name: 'asset-categories', component: () => import('../views/asset-categories/AssetCategoriesView.vue') },
      { path: 'requisitions',     name: 'requisitions',     component: () => import('../views/requisitions/RequisitionsView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && auth.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router