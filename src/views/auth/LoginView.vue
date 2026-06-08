<template>
  <div class="min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, #1A3A6B 0%, #0d2347 50%, #1A3A6B 100%);">
    
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style="background: #F5A623;"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style="background: #F5A623;"></div>
      <div class="absolute top-1/2 left-1/4 w-40 h-40 rounded-full opacity-5" style="background: #F5A623;"></div>
    </div>

    <div class="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
      
      <!-- Logo & Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <img src="/ciu-logo.png" alt="CIU Logo" class="h-20 w-20 object-contain" />
        </div>
        <h1 class="text-xl font-bold" style="color: #1A3A6B;">Chittagong Independent University</h1>
        <p class="text-sm mt-1" style="color: #F5A623; font-weight: 600;">Inventory Management System</p>
        <div class="mt-3 h-1 w-16 mx-auto rounded-full" style="background: linear-gradient(90deg, #1A3A6B, #F5A623);"></div>
      </div>

      <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm border border-red-100">
        ⚠️ {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="text-xs font-semibold" style="color: #1A3A6B;">Email Address</label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
            <input v-model="form.email" type="email" required placeholder="your@email.com"
              class="w-full border-2 border-gray-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none transition"
              style="focus:border-color: #1A3A6B;"
              @focus="e => e.target.style.borderColor='#1A3A6B'"
              @blur="e => e.target.style.borderColor='#e5e7eb'" />
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold" style="color: #1A3A6B;">Password</label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
            <input v-model="form.password" type="password" required placeholder="••••••••"
              class="w-full border-2 border-gray-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none transition"
              @focus="e => e.target.style.borderColor='#1A3A6B'"
              @blur="e => e.target.style.borderColor='#e5e7eb'" />
          </div>
        </div>
        <button type="submit" :disabled="loading"
          class="w-full text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 mt-2"
          style="background: linear-gradient(135deg, #1A3A6B, #2a5298);"
          @mouseover="e => e.target.style.background='linear-gradient(135deg, #F5A623, #e8941a)'"
          @mouseleave="e => e.target.style.background='linear-gradient(135deg, #1A3A6B, #2a5298)'">
          {{ loading ? '⏳ Logging in...' : '🔐 Login' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        Don't have an account?
        <router-link to="/register" class="font-semibold hover:underline" style="color: #F5A623;">Register here</router-link>
      </p>

      <div class="mt-6 pt-4 border-t border-gray-100 text-center">
        <p class="text-xs text-gray-400">Lord Advance Me In Knowledge</p>
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
const error = ref(null)
const loading = ref(false)
const form = ref({ email: '', password: '' })

async function handleLogin() {
  loading.value = true
  error.value = null
  try {
    await auth.login(form.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>