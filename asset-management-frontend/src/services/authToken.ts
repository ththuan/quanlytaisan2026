let accessToken: string | null = null;

/** Access token chỉ giữ trong bộ nhớ, không ghi localStorage/sessionStorage. */
export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const clearAccessToken = (): void => {
  accessToken = null;
};
