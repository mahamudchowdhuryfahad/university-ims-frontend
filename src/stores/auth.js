import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

function safeParseUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user  = ref(safeParseUser())

  const isAuthenticated = computed(() => !!token.value)

  async function login(credentials) {
    try {
      const res = await api.post('/auth/login', credentials)
      token.value = res.data.data.token
      user.value  = res.data.data.user
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      return res.data
    } catch (err) {
      token.value = null
      user.value  = null
      throw err
    }
  }

  async function logout() {
    try { await api.post('/auth/logout') } catch {}
    token.value = null
    user.value  = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function hasPermission(permission) {
    return user.value?.permissions?.includes(permission)
  }

  function hasRole(role) {
    return user.value?.roles?.includes(role)
  }

  function hasAnyRole(roles) {
    return roles.some(role => user.value?.roles?.includes(role))
  }

  return { token, user, isAuthenticated, login, logout, hasPermission, hasRole, hasAnyRole }
})