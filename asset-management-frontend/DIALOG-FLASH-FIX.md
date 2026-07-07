# Fix cho vấn đề nhấp nháy (flash) khi đóng Dialog/Popup

## Vấn đề
Khi đóng các popup (dialog, drawer, v.v.) trên Chrome/Edge desktop, màn hình bị nhấp nháy trắng một cái.

## Nguyên nhân
Element Plus sử dụng fade-out animation khi đóng dialog. Trong quá trình fade, background tạm thời hiển thị màu trắng gây hiện tượng flash.

## Giải pháp

### 1. **CSS Overrides** (Tự động áp dụng cho TẤT CẢ dialogs)
Files:
- `src/styles/dialog-close-fix.scss` - Force instant close cho tất cả overlay/dialog
- `src/styles/dialog-optimization.scss` - GPU acceleration và optimization
- `src/styles/motion.scss` - Override fade transitions

**Cách hoạt động:**
- Override tất cả Vue transition classes (`.v-leave-active`, `.v-leave-to`)
- Force `transition: none !important` khi đóng
- Set `opacity: 0 !important` ngay lập tức
- Thêm `visibility: hidden` và `pointer-events: none`

### 2. **JavaScript Handlers** (App.vue)
**Global event listeners:**
- Click vào nút close
- Click vào overlay backdrop
- Press ESC key
- MutationObserver để catch programmatic closes (v-model changes)

**Cách hoạt động:**
- Detect khi dialog bắt đầu đóng
- Disable transitions inline: `element.style.transition = 'none'`
- Re-enable sau 300ms (sau khi dialog đã unmount)

### 3. **Composable Helper** (Optional)
File: `src/composables/useDialogOptimization.ts`

Cung cấp `useSmoothDialog()` cho các dialog components muốn có control tốt hơn.

## Kết quả
✅ **KHÔNG cần sửa bất kỳ dialog component nào**
✅ Tự động áp dụng cho:
  - `<el-dialog>` - Tất cả forms, details, etc.
  - `<el-drawer>` - Drawers
  - `<el-message-box>` - Confirm dialogs
  - `<el-popover>` - Popovers
  - `<el-date-picker>`, `<el-select>`, etc. - Dropdowns

✅ Hoạt động với:
  - Click nút close (X)
  - Click ra ngoài overlay
  - Press ESC
  - Programmatic close (v-model = false)

✅ Không ảnh hưởng:
  - Mobile/tablet (chỉ apply cho desktop ≥1024px)
  - Message boxes hệ thống (vẫn giữ animation nhẹ)

## Testing
Để test fix này:
1. Mở bất kỳ dialog nào (tạo tài sản, tạo đề nghị, etc.)
2. Đóng dialog bằng:
   - Click nút X
   - Click ra ngoài
   - Press ESC
3. **Không còn flash trắng!**

## Browser Support
- ✅ Chrome/Edge (primary target)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Performance Impact
- Minimal - chỉ thêm event listeners và MutationObserver
- CSS rules được optimize với `!important` để override nhanh
- Không impact dialog open animation (vẫn smooth)

## Notes
- Fix này aggressive về việc disable transitions
- Trade-off: Mất smooth close animation nhưng **không còn flash**
- Có thể adjust `closeDelay` trong composable nếu cần fine-tune
