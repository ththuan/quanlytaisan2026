/**
 * Tải file theo cách phù hợp PWA/iOS: dùng share sheet nếu có,
 * fallback về thẻ <a download> cho trình duyệt desktop/Android.
 */
export const saveBlob = async (blob: Blob, filename: string): Promise<void> => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };

  const file = new File([blob], filename, {
    type: blob.type || 'application/octet-stream',
  });

  if ((isIOS || isStandalone) && nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: filename });
      return;
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      // fallback bên dưới
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
