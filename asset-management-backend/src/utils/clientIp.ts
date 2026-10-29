import { Request } from 'express';

const cleanIp = (value: string): string => {
  const first = value.split(',')[0]?.trim() || '';
  return first.replace(/^::ffff:/, '').replace(/^\[|\]$/g, '');
};

const isPrivateOrLoopback = (ip: string): boolean => {
  if (!ip) return false;
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
  if (ip.startsWith('127.') || ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true;
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;

  const match = /^172\.(\d{1,3})\./.exec(ip);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
};

/**
 * Chỉ tin header do proxy (Cloudflare/nginx) gửi khi kết nối trực tiếp đến
 * backend là từ mạng nội bộ/loopback. Client Internet không thể tự đặt IP.
 */
export const getClientIp = (req: Request): string => {
  const socketIp = cleanIp(req.socket?.remoteAddress || req.ip || '');
  const fromTrustedProxy = isPrivateOrLoopback(socketIp);

  if (fromTrustedProxy) {
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) return cleanIp(cfConnectingIp);

    const trueClientIp = req.headers['true-client-ip'];
    if (typeof trueClientIp === 'string' && trueClientIp.trim()) return cleanIp(trueClientIp);

    const forwarded = req.headers['x-forwarded-for'];
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (forwardedValue?.trim()) return cleanIp(forwardedValue);

    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) return cleanIp(realIp);
  }

  return socketIp;
};
