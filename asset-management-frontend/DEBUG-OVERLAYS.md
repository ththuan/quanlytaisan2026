# Debug Script - Kiểm tra Overlays Block Clicks

## Vấn đề
Buttons không hoạt động - có thể do overlays ẩn đang block clicks.

## Cách debug:

### 1. Mở Developer Console (F12)

### 2. Chạy script này để kiểm tra overlays:

```javascript
// Tìm tất cả overlays
const overlays = document.querySelectorAll('.el-overlay');
console.log(`Tìm thấy ${overlays.length} overlays`);

overlays.forEach((overlay, index) => {
  const style = window.getComputedStyle(overlay);
  const hasDialog = overlay.querySelector('.el-dialog');
  const hasDrawer = overlay.querySelector('.el-drawer');
  const hasMsgBox = overlay.querySelector('.el-message-box');
  
  console.log(`Overlay ${index}:`, {
    opacity: style.opacity,
    display: style.display,
    visibility: style.visibility,
    zIndex: style.zIndex,
    pointerEvents: style.pointerEvents,
    hasDialog: !!hasDialog,
    hasDrawer: !!hasDrawer,
    hasMsgBox: !!hasMsgBox,
    childrenCount: overlay.children.length
  });
});
```

### 3. Nếu tìm thấy overlays ẩn (opacity: 0, display: none), xóa chúng:

```javascript
// Xóa tất cả overlays ẩn
const overlays = document.querySelectorAll('.el-overlay');
overlays.forEach(overlay => {
  const style = window.getComputedStyle(overlay);
  if (style.opacity === '0' || style.display === 'none') {
    console.log('Xóa overlay ẩn:', overlay);
    overlay.remove();
  }
});

// Restore body scroll
document.body.classList.remove('el-popup-parent--hidden');
document.body.style.overflow = '';
document.body.style.paddingRight = '';

console.log('Đã cleanup overlays!');
```

### 4. Kiểm tra pointer-events trên body:

```javascript
const bodyStyle = window.getComputedStyle(document.body);
console.log('Body pointer-events:', bodyStyle.pointerEvents);

const mainContent = document.querySelector('.el-main');
if (mainContent) {
  const mainStyle = window.getComputedStyle(mainContent);
  console.log('Main content pointer-events:', mainStyle.pointerEvents);
}
```

### 5. Kiểm tra buttons:

```javascript
const buttons = document.querySelectorAll('.el-button');
console.log(`Tìm thấy ${buttons.length} buttons`);

buttons.forEach((btn, index) => {
  const style = window.getComputedStyle(btn);
  if (style.pointerEvents === 'none' || style.visibility === 'hidden' || style.display === 'none') {
    console.log(`Button ${index} bị disable:`, {
      text: btn.textContent.trim(),
      pointerEvents: style.pointerEvents,
      visibility: style.visibility,
      display: style.display,
      disabled: btn.disabled
    });
  }
});
```

## Giải pháp nhanh

Nếu có overlays block clicks, chạy lệnh này:

```javascript
// EMERGENCY FIX: Xóa tất cả overlays
document.querySelectorAll('.el-overlay').forEach(el => el.remove());
document.body.classList.remove('el-popup-parent--hidden');
document.body.style.overflow = '';
document.body.style.paddingRight = '';
location.reload();
```

## Sau khi fix

1. Hard refresh: Ctrl+Shift+R (Windows/Linux) hoặc Cmd+Shift+R (Mac)
2. Clear cache: F12 → Network tab → Disable cache
3. Test lại các buttons
