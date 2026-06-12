<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-blue-900 bg-opacity-20" @click="$emit('close')"></div>
    <div class="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden" :class="maxWidth" @click.stop>

      <!-- Header -->
      <div class="px-6 py-4 flex justify-between items-center" style="background: #1A3A6B; border-top: 4px solid #F5A623;">
        <h3 class="text-base font-bold text-white">{{ title }}</h3>
        <button @click="$emit('close')" class="text-white opacity-70 hover:opacity-100 text-xl transition">×</button>
      </div>

      <!-- Body -->
      <div class="p-6 max-h-[75vh] overflow-y-auto">
        <slot />
      </div>

    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: Boolean,
  title: String,
  maxWidth: { type: String, default: 'max-w-lg' },
})
const emit = defineEmits(['close'])

function handleEscape(e) {
  if (e.key === 'Escape' && props.show) emit('close')
}

watch(() => props.show, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(() => window.addEventListener('keydown', handleEscape))
onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>
