<template>
  <div class="flex min-h-screen bg-[#0d2347]">

    <!-- Left Panel -->
    <div class="hidden md:flex w-5/12 flex-col items-center justify-center px-8 py-12" style="background: #1A3A6B;">
      <img src="/ciu-logo.png" alt="CIU Logo"
        class="w-32 h-32 object-contain mb-6 drop-shadow-lg"
        @error="logoError = true"
        v-if="!logoError" />
      <div v-else
        class="w-28 h-28 rounded-full flex items-center justify-center mb-6 text-3xl font-bold"
        style="background: #F5A623; color: #1A3A6B;">
        CIU
      </div>
      <h1 class="text-white text-base font-medium text-center leading-relaxed mb-1">
        Chittagong Independent University
      </h1>
      <p class="text-xs font-medium text-center" style="color: #F5A623;">
        Inventory Management System
      </p>
    </div>

    <!-- Right Panel -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
      <div class="w-full max-w-xs">

        <!-- Mobile logo -->
        <div class="flex flex-col items-center mb-8 md:hidden">
          <img src="/ciu-logo.png" alt="CIU Logo" class="w-20 h-20 object-contain mb-3" v-if="!logoError" @error="logoError = true" />
          <p class="text-sm font-medium text-center" style="color: #1A3A6B;">Chittagong Independent University</p>
          <p class="text-xs mt-1" style="color: #F5A623;">Inventory Management System</p>
        </div>

        <div class="w-8 h-0.5 mb-5" style="background: #F5A623;"></div>
        <h2 class="text-xl font-medium mb-1" style="color: #1A3A6B;">Welcome back</h2>
        <p class="text-xs text-gray-400 mb-7">Sign in to your account to continue</p>

        <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-5 text-xs border border-red-100">
          ⚠️ {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Email address</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</span>
              <input v-model="form.email" type="email" required placeholder="your@ciu.edu.bd"
                class="w-full border border-gray-200 rounded-lg px-9 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 transition"
                style="color: #111827;" />
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Password</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
              <input v-model="form.password" type="password" required placeholder="••••••••"
                class="w-full border border-gray-200 rounded-lg px-9 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-900 transition"
                style="color: #111827;" />
            </div>
          </div>

          <button type="submit" :disabled="loading"
            class="w-full py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
            style="background: #1A3A6B;"
            @mouseover="e => e.currentTarget.style.background = '#F5A623'"
            @mouseleave="e => e.currentTarget.style.background = '#1A3A6B'">
            {{ loading ? '⏳ Signing in...' : '🔐 Sign in' }}
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-5">
          New user?
          <router-link to="/register" class="font-medium hover:underline" style="color: #F5A623;">Register here</router-link>
        </p>

        <div class="mt-8 pt-5 border-t border-gray-200 text-center">
          <p class="text-xs text-gray-400">
            © {{ new Date().getFullYear() }} <span class="font-medium" style="color: #1A3A6B;">CIU Software Team</span>
            · All Rights Reserved
          </p>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router   = useRouter()
const auth     = useAuthStore()
const error    = ref(null)
const loading  = ref(false)
const logoError = ref(false)
const form     = ref({ email: '', password: '' })

async function handleLogin() {
  loading.value = true
  error.value   = null
  try {
    await auth.login(form.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>