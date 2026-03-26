/**
 * Hiển thị nhãn danh mục tài sản: ưu tiên tên từ API, sau đó i18n theo mã, tránh key kiểu categories.null.
 */
export function formatAssetCategoryLabel(
  asset: Record<string, unknown> | null | undefined,
  t: (key: string) => string,
  te: (key: string) => boolean,
): string {
  if (!asset) return t('common.notSpecified');

  const ac = asset.assetCategory as { name?: string } | undefined;
  if (ac?.name?.trim()) return ac.name.trim();

  const categoryName = asset.category_name;
  if (typeof categoryName === 'string' && categoryName.trim()) return categoryName.trim();

  const cat = asset.category;
  if (cat != null && String(cat).trim() !== '' && String(cat) !== 'null') {
    const k = String(cat).trim();
    const path = `categories.${k}`;
    if (te(path)) return t(path);
    return k;
  }

  const code = asset.category_code;
  if (typeof code === 'string' && code.trim()) {
    const path = `categories.${code}`;
    if (te(path)) return t(path);
    return code;
  }

  return t('common.notSpecified');
}

/** Trạng thái / enum: chỉ gọi i18n khi key tồn tại, tránh assets.status.undefined */
export function formatI18nOrRaw(
  prefix: string,
  value: string | null | undefined,
  t: (key: string) => string,
  te: (key: string) => boolean,
): string {
  if (value == null || String(value).trim() === '' || String(value) === 'null') {
    return t('common.notSpecified');
  }
  const v = String(value).trim();
  const path = `${prefix}.${v}`;
  if (te(path)) return t(path);
  return v;
}
