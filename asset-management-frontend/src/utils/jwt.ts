export interface ClientJwtPayload {
  id?: number;
  sid?: string;
  token_type?: 'access' | 'refresh';
  exp?: number;
  [key: string]: unknown;
}

/** Decode JWT Base64URL safely, including UTF-8 Vietnamese user names. */
export function decodeJwtPayload(token: string): ClientJwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;

    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), char => char.charCodeAt(0));
    const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return JSON.parse(json) as ClientJwtPayload;
  } catch {
    return null;
  }
}
