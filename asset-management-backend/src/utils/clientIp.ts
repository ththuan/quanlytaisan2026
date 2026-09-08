import { Request } from 'express';

const cleanIp = (value: string): string => {
  const first = value.split(',')[0]?.trim() || '';
  return first.replace(/^::ffff:/, '').replace(/^\[|\]$/g, '');
};

/** Resolve the original address through Cloudflare Tunnel and nginx. */
export const getClientIp = (req: Request): string => {
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) return cleanIp(cfConnectingIp);

  const trueClientIp = req.headers['true-client-ip'];
  if (typeof trueClientIp === 'string' && trueClientIp.trim()) return cleanIp(trueClientIp);

  const forwarded = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (forwardedValue?.trim()) return cleanIp(forwardedValue);

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return cleanIp(realIp);

  return cleanIp(req.ip || req.socket?.remoteAddress || '');
};
