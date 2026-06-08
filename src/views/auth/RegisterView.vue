<template>
  <div class="min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, #1A3A6B 0%, #0d2347 50%, #1A3A6B 100%);">

    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style="background: #F5A623;"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style="background: #F5A623;"></div>
    </div>

    <div class="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">

      <!-- Logo & Header -->
      <div class="text-center mb-6">
        <div class="flex justify-center mb-3">
          <img src="/ciu-logo.png" alt="CIU Logo" class="h-16 w-16 object-contain" />
        </div>
        <h1 class="text-xl font-bold" style="color: #1A3A6B;">Create Account</h1>
        <p class="text-sm mt-1" style="color: #F5A623; font-weight: 600;">University IMS Registration</p>
        <div class="mt-3 h-1 w-16 mx-auto rounded-full" style="background: linear-gradient(90deg, #1A3A6B, #F5A623);"></div>
      </div>

      <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm border border-red-100">⚠️ {{ error }}</div>
      <div v-if="success" class="bg-green-50 text-green-600 px-4 py-3 rounded-xl mb-4 text-sm border border-green-100">✅ {{ success }}</div>

      <form @submit.prevent="handleRegister" class="space-y-3">
        <div>
          <label class="text-xs font-semibold" style="color: #1A3A6B;">Full Name *</label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
            <input v-model="form.name" type="text" required placeholder="Your Full Name"
              class="w-full border-2 border-gray-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none transition"
              @focus="e => e.target.style.borderColor='#1A3A6B'"
              @blur="e => e.target.style.borderColor='#e5e7eb'" />
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold" style="color: #1A3A6B;">Email Address *</label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
            <input v-model="form.email" type="email" required placeholder="your@email.com"
              class="w-full border-2 border-gray-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none transition"
              @focus="e => e.target.style.borderColor='#1A3A6B'"
              @blur="e => e.target.style.borderColor='#e5e7eb'" />
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold" style="color: #1A3A6B;">Password *</label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
            <input v-model="form.password" type="password" required placeholder="Min 8 characters"
              class="w-full border-2 border-gray-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none transition"
              @focus="e => e.target.style.borderColor='#1A3A6B'"
              @blur="e => e.target.style.borderColor='#e5e7eb'" />
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold" style="color: #1A3A6B;">Confirm Password *</label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
            <input v-model="form.password_confirmation" type="password" required placeholder="Repeat password"
              class="w-full border-2 border-gray-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none transition"
              @focus="e => e.target.style.borderColor='#1A3A6B'"
              @blur="e => e.target.style.borderColor='#e5e7eb'" />
          </div>
        </div>

        <div class="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 border border-blue-100">
          ℹ️ Your account will be reviewed and activated by the administrator.
        </div>

        <button type="submit" :disabled="loading"
          class="w-full text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          style="background: linear-gradient(135deg, #1A3A6B, #2a5298);"
          @mouseover="e => e.target.style.background='linear-gradient(135deg, #F5A623, #e8941a)'"
          @mouseleave="e => e.target.style.background='linear-gradient(135deg, #1A3A6B, #2a5298)'">
          {{ loading ? '⏳ Registering...' : '📝 Register' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-5">
        Already have an account?
        <router-link to="/login" class="font-semibold hover:underline" style="color: #F5A623;">Login here</router-link>
      </p>

      <div class="mt-5 pt-4 border-t border-gray-100 text-center">
  <p class="text-xs text-gray-400">© {{ new Date().getFullYear() }} CIU Software Team. All Rights Reserved.</p>
</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'

const router = useRouter()
const error = ref(null)
const success = ref(null)
const loading = ref(false)
const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

async function handleRegister() {
  loading.value = true
  error.value = null
  success.value = null
  try {
    await api.post('/auth/register', form.value)
    success.value = 'Registration successful! Please wait for admin approval.'
    setTimeout(() => router.push('/login'), 3000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>