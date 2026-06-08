<template>
  <button
    :type="type"
    :disabled="disabled"
    class="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
    :style="buttonStyle"
    @mouseover="hovered = true"
    @mouseleave="hovered = false">
    <slot />
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'button' },
  disabled: Boolean,
  variant: { type: String, default: 'primary' },
})

const hovered = ref(false)

const buttonStyle = computed(() => {
  if (props.variant === 'primary') {
    return {
      background: hovered.value
        ? 'linear-gradient(135deg, #F5A623, #e8941a)'
        : 'linear-gradient(135deg, #1A3A6B, #2a5298)',
      color: 'white',
    }
  }
  if (props.variant === 'danger') {
    return {
      background: hovered.value ? '#dc2626' : '#ef4444',
      color: 'white',
    }
  }
  if (props.variant === 'secondary') {
    return {
      background: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
    }
  }
  return {}
})
</script>