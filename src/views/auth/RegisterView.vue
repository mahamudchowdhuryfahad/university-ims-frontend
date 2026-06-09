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

      <!-- Notice — Style 1 -->
      <div class="mt-8 w-full" style="border-left: 3px solid #F5A623; padding: 0.75rem 1rem; background: rgba(245,166,35,0.07); border-radius: 0 8px 8px 0;">
        <div class="flex items-center gap-2 mb-1">
          <i class="ti ti-shield-check" style="font-size: 14px; color: #F5A623;" aria-hidden="true"></i>
          <span style="font-size: 11px; font-weight: 500; color: #F5A623;">Admin approval required</span>
        </div>
        <p style="font-size: 11px; color: rgba(255,255,255,0.6); line-height: 1.6;">
          New accounts require admin approval before activation. You will be notified once your account is active.
        </p>
      </div>
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
        <h2 class="text-xl font-medium mb-1" style="color: #1A3A6B;">Create account</h2>
        <p class="text-xs text-gray-400 mb-6">Fill in your details to request access</p>

        <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-xs border border-red-100">
          ⚠️ {{ error }}
        </div>
        <div v-if="success" class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-xs border border-green-100">
          ✅ {{ success }}
        </div>

        <form @submit.prevent="handleRegister" class="space-y-3.5">
          <div>
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Full name</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
              <input v-model="form.name" type="text" required placeholder="Your full name"
                class="w-full border border-gray-200 rounded-lg px-9 py-2.5 text-sm bg-white focus:outline-none transition"
                style="color: #111827;"
                @focus="e => e.target.style.borderColor='#1A3A6B'"
                @blur="e => e.target.style.borderColor='#e5e7eb'" />
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Email address</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</span>
              <input v-model="form.email" type="email" required placeholder="your@ciu.edu.bd"
                class="w-full border border-gray-200 rounded-lg px-9 py-2.5 text-sm bg-white focus:outline-none transition"
                style="color: #111827;"
                @focus="e => e.target.style.borderColor='#1A3A6B'"
                @blur="e => e.target.style.borderColor='#e5e7eb'" />
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Password</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
              <input v-model="form.password" type="password" required placeholder="Min 8 characters"
                class="w-full border border-gray-200 rounded-lg px-9 py-2.5 text-sm bg-white focus:outline-none transition"
                style="color: #111827;"
                @focus="e => e.target.style.borderColor='#1A3A6B'"
                @blur="e => e.target.style.borderColor='#e5e7eb'" />
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Confirm password</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
              <input v-model="form.password_confirmation" type="password" required placeholder="Repeat password"
                class="w-full border border-gray-200 rounded-lg px-9 py-2.5 text-sm bg-white focus:outline-none transition"
                style="color: #111827;"
                @focus="e => e.target.style.borderColor='#1A3A6B'"
                @blur="e => e.target.style.borderColor='#e5e7eb'" />
            </div>
          </div>

          <button type="submit" :disabled="loading"
            class="w-full py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition disabled:opacity-50 mt-1"
            style="background: #1A3A6B;"
            @mouseover="e => e.currentTarget.style.background = '#F5A623'"
            @mouseleave="e => e.currentTarget.style.background = '#1A3A6B'">
            {{ loading ? '⏳ Registering...' : '📝 Register' }}
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-5">
          Already have an account?
          <router-link to="/login" class="font-medium hover:underline" style="color: #F5A623;">Login here</router-link>
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
import api from '../../services/api'

const router    = useRouter()
const error     = ref(null)
const success   = ref(null)
const loading   = ref(false)
const logoError = ref(false)
const form      = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

async function handleRegister() {
  loading.value = true
  error.value   = null
  success.value = null
  try {
    await api.post('/auth/register', form.value)
    success.value = 'Registration successful! Please wait for admin approval.'
    setTimeout(() => router.push('/login'), 3000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
