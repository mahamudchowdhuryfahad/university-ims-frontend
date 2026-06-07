<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
        <div class="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">📦</span>
        </div>
        <h1 class="text-2xl font-bold text-white">IMS</h1>
        <p class="text-blue-200 text-sm mt-1">Inventory Management System</p>
      </div>

      <div class="p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-1">Welcome back!</h2>
        <p class="text-gray-500 text-sm mb-6">Sign in to your account to continue</p>

        <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Email Address</label>
            <input v-model="form.email" type="email" required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="admin@ims.com" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <div class="relative">
              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10"
                placeholder="password" />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <button type="submit" :disabled="loading"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition hover:opacity-90 disabled:opacity-60">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-6">
          © {{ new Date().getFullYear() }} IMS — Inventory Management System
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const error = ref(null)
const showPassword = ref(false)

const form = ref({
  email: 'admin@ims.com',
  password: 'password',
})

async function handleLogin() {
  loading.value = true
  error.value = null
  try {
    await auth.login(form.value.email, form.value.password)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>