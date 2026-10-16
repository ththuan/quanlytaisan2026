import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Quản lý hộp thoại ký xác nhận (chữ ký sống).
 * Dùng:
 *   const sign = useSignature();
 *   const sig = await sign.request('Ký xác nhận ...'); // null nếu hủy
 *   <SignaturePad v-model="sign.show.value" ... @confirm="sign.onConfirm" />
 */
export function useSignature() {
  const authStore = useAuthStore();
  const show = ref(false);
  const title = ref('Ký xác nhận');
  const signerName = computed(() => authStore.user?.fullname || authStore.user?.username || '');

  let resolver: ((sig: string | null) => void) | null = null;

  const request = (t: string): Promise<string | null> => {
    title.value = t;
    show.value = true;
    return new Promise((resolve) => {
      resolver = resolve;
    });
  };

  const onConfirm = (sig: string) => {
    resolver?.(sig);
    resolver = null;
  };

  watch(show, (open) => {
    if (!open && resolver) {
      resolver(null);
      resolver = null;
    }
  });

  return { show, title, signerName, request, onConfirm };
}
