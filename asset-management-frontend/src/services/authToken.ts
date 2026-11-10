// Lưu access token để PWA có thể mở lại và nhập liệu khi tạm mất mạng.
// Refresh token vẫn nằm trong cookie HttpOnly; token này sẽ được làm mới khi online.
let accessToken: string | null = (() => {
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
})();

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
  try {
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  } catch {
    // bỏ qua nếu localStorage bị chặn
  }
};

export const clearAccessToken = (): void => {
  accessToken = null;
  try {
    localStorage.removeItem('accessToken');
  } catch {
    // bỏ qua
  }
};
