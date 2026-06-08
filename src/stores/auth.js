import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user  = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(credentials) {
  const res = await api.post('/auth/login', credentials)
  token.value = res.data.data.token
  user.value  = res.data.data.user
  localStorage.setItem('token', token.value)
  localStorage.setItem('user', JSON.stringify(user.value))
  return res.data
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

  return { token, user, isAuthenticated, login, logout, hasPermission }
})