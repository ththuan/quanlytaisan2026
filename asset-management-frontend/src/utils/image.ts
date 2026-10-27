/**
 * Chuẩn hóa ảnh trước khi upload:
 * - Giảm kích thước để tránh quá giới hạn body/multer và upload nhanh hơn trên 3G/4G.
 * - Chuyển HEIC/HEIF (ảnh mặc định của iPhone) sang JPEG để backend/browser hiển thị được.
 */
export async function prepareImageForUpload(
  file: File,
  options: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.82;

  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  try {
    const image = await loadImage(file);
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });
    if (!blob) return file;
    // Ảnh đã nhỏ sẵn thì vẫn chuyển JPEG để thống nhất định dạng.
    const baseName = file.name.replace(/\.[^.]+$/, '') || `image_${Date.now()}`;
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Cannot read image'));
    };
    img.src = url;
  });
}
