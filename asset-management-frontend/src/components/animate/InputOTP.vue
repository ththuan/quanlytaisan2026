<template>
  <div
    class="otp"
    :class="{ 'otp--disabled': disabled, 'otp--error': error }"
    role="group"
    :aria-label="ariaLabel"
  >
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="(el) => setInputRef(el, index)"
      :value="digit"
      class="otp__cell"
      :class="{ 'otp__cell--filled': digit !== '' }"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="1"
      :disabled="disabled"
      :aria-label="`${ariaLabel} - ${index + 1}`"
      @input="handleInput(index, $event)"
      @keydown="handleKeydown(index, $event)"
      @paste="handlePaste(index, $event)"
      @focus="handleFocus($event)"
    >
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    length?: number;
    disabled?: boolean;
    autofocus?: boolean;
    error?: boolean;
    ariaLabel?: string;
  }>(),
  {
    length: 6,
    disabled: false,
    autofocus: false,
    error: false,
    ariaLabel: 'Mã xác thực',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  complete: [value: string];
  enter: [value: string];
}>();

const inputs = ref<(HTMLInputElement | null)[]>([]);
const digits = ref<string[]>(normalize(props.modelValue));

function normalize(value: string): string[] {
  const chars = (value || '').replace(/\D/g, '').slice(0, props.length).split('');
  return Array.from({ length: props.length }, (_, index) => chars[index] ?? '');
}

const setInputRef = (el: unknown, index: number) => {
  inputs.value[index] = el instanceof HTMLInputElement ? el : null;
};

const focusCell = (index: number) => {
  const clamped = Math.max(0, Math.min(props.length - 1, index));
  inputs.value[clamped]?.focus();
  inputs.value[clamped]?.select();
};

const syncValue = () => {
  const value = digits.value.join('');
  emit('update:modelValue', value);
  if (value.length === props.length) emit('complete', value);
  return value;
};

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const raw = target.value.replace(/\D/g, '');
  target.value = '';

  if (!raw) {
    digits.value[index] = '';
    syncValue();
    return;
  }

  const chars = raw.split('');
  let cursor = index;
  for (const char of chars) {
    if (cursor >= props.length) break;
    digits.value[cursor] = char;
    cursor += 1;
  }

  syncValue();
  focusCell(cursor);
};

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace') {
    event.preventDefault();
    if (digits.value[index]) {
      digits.value[index] = '';
      syncValue();
      focusCell(index);
      return;
    }
    if (index > 0) {
      digits.value[index - 1] = '';
      syncValue();
      focusCell(index - 1);
    }
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    focusCell(index - 1);
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    focusCell(index + 1);
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    const value = digits.value.join('');
    emit('enter', value);
    if (value.length === props.length) emit('complete', value);
  }
};

const handlePaste = (index: number, event: ClipboardEvent) => {
  event.preventDefault();
  const text = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
  if (!text) return;

  const chars = text.split('');
  let cursor = index;
  for (const char of chars) {
    if (cursor >= props.length) break;
    digits.value[cursor] = char;
    cursor += 1;
  }

  syncValue();
  focusCell(cursor);
};

const handleFocus = (event: FocusEvent) => {
  (event.target as HTMLInputElement).select();
};

const focus = () => {
  const firstEmpty = digits.value.findIndex((digit) => !digit);
  focusCell(firstEmpty === -1 ? 0 : firstEmpty);
};

watch(
  () => props.modelValue,
  (value) => {
    const next = normalize(value);
    if (next.join('') !== digits.value.join('')) digits.value = next;
  },
);

onMounted(() => {
  if (props.autofocus) focus();
});

defineExpose({ focus });
</script>

<style scoped>
.otp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.otp__cell {
  width: 44px;
  height: 52px;
  padding: 0;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  font-family: inherit;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}

.otp__cell:hover:not(:disabled) {
  border-color: #94a3b8;
}

.otp__cell:focus:not(:disabled) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  transform: translateY(-1px);
}

.otp__cell--filled {
  border-color: #93c5fd;
  background: #f8fbff;
  animation: otp-cell-pop 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.otp--error .otp__cell {
  border-color: #fca5a5;
}

.otp--error .otp__cell:focus:not(:disabled) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
}

.otp--disabled .otp__cell {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

@keyframes otp-cell-pop {
  0% {
    transform: scale(0.88);
  }
  60% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 420px) {
  .otp {
    gap: 6px;
  }

  .otp__cell {
    width: 38px;
    height: 46px;
    font-size: 20px;
    border-radius: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .otp__cell {
    transition: none;
  }

  .otp__cell--filled {
    animation: none;
  }
}
</style>
